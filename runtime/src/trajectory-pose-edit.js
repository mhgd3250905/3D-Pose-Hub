import { anchorIdentity, anchorKey } from './foot-curves.js';
import { getTrajectoryAnchors } from './trajectory-range.js';
import { transitionOptions } from './transition-edits.js';
import { samePose } from './official-poses.js';

const clone = value => structuredClone(value);
const DIFFERENCE_STEP = .002, MAXIMUM_STEP = .08, DAMPING = .02, GOAL_TOLERANCE = 1e-5;
const length = value => Math.hypot(...value);
const subtract = (first, second) => first.map((value, index) => value - second[index]);
function vector(value, label) {
  if (!Array.isArray(value) || value.length !== 3 || Array.from(value).some(number => typeof number !== 'number' || !Number.isFinite(number))) {
    throw new TypeError(`${label}需要三个有限坐标。`);
  }
  return clone(value);
}

function mergePose(previous, solved) {
  if (!solved || typeof solved !== 'object' || Array.isArray(solved)) throw new TypeError('关节解算没有返回有效姿态。');
  const result = { ...clone(previous), ...clone(solved) };
  if (previous.limbs && solved.limbs) {
    result.limbs = { ...clone(previous.limbs), ...clone(solved.limbs) };
    for (const side of ['left', 'right']) if (previous.limbs[side] && solved.limbs[side]) {
      result.limbs[side] = { ...clone(previous.limbs[side]), ...clone(solved.limbs[side]) };
    }
  }
  return result;
}

function dampedStep(columns, residual) {
  const matrix = columns.map((column, row) => [
    ...columns.map((other, index) => column.reduce((sum, value, component) => sum + value * other[component], 0) + (row === index ? DAMPING * DAMPING : 0)),
    column.reduce((sum, value, component) => sum + value * residual[component], 0),
  ]);
  for (let column = 0; column < 3; column++) {
    let pivot = column;
    for (let row = column + 1; row < 3; row++) if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    if (!Number.isFinite(matrix[pivot][column]) || Math.abs(matrix[pivot][column]) < 1e-14) return null;
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    const divisor = matrix[column][column];matrix[column] = matrix[column].map(value => value / divisor);
    for (let row = 0; row < 3; row++) if (row !== column) {
      const factor = matrix[row][column];matrix[row] = matrix[row].map((value, index) => value - factor * matrix[column][index]);
    }
  }
  let step = matrix.map(row => row[3]);
  if (step.some(value => !Number.isFinite(value))) return null;
  const magnitude = length(step);
  if (magnitude > MAXIMUM_STEP) step = step.map(value => value * MAXIMUM_STEP / magnitude);
  return step;
}

/** Move only one explicitly selected active saved frame. Each candidate is
 * constrained by pure joint IK and measured through actual sequence sampling.
 * The original document base is retained: original-frame results must be
 * rebased and saved by the existing official-frame transaction in the caller.
 * No live pose, animation state or storage method is called here.
 */
export function solveTrajectoryPose({ motion, sequence, edits, anchor, time, joint, target, maxIterations = 5 } = {}) {
  if (!motion || typeof motion.solveJointPose !== 'function' || typeof motion.sampleTrajectory !== 'function') throw new TypeError('轨迹调整需要纯关节解算与轨迹采样接口。');
  if (typeof time !== 'number' || !Number.isFinite(time) || typeof joint !== 'string' || !joint.trim()) throw new TypeError('请选择有效的轨迹时间和关节。');
  if (!Number.isInteger(maxIterations) || maxIterations < 0 || maxIterations > 5) throw new RangeError('轨迹调整最多执行五轮迭代。');
  if (!edits || typeof edits !== 'object' || Array.isArray(edits) || typeof edits.enabled !== 'boolean' || !Array.isArray(edits.points)) throw new TypeError('轨迹调整需要当前保存的过渡记录。');
  const requestedPosition = vector(target, '目标位置'), identity = anchorIdentity(anchor), selectedKey = anchorKey(identity);
  const source = clone(sequence), document = clone(edits), anchors = getTrajectoryAnchors(source, document);
  const selected = anchors.find(value => value.key === selectedKey);
  if (!selected) throw new Error('选定的关键帧已不存在。');
  if (!selected.active) throw new Error('请先恢复或启用选定的关键帧，再调整轨迹。');
  const index = identity.kind === 'step' ? source.steps.findIndex(step => step.id === identity.id) : document.points.findIndex(point => point.id === identity.id);
  const originalPose = clone(identity.kind === 'step' ? source.steps[index].pose : document.points[index].pose);
  const last = source.steps.length - 1;
  const linked = identity.kind === 'step' && (index === 0 || index === last) && samePose(source.steps[0].pose, source.steps[last].pose);
  const linkedIndices = linked ? [...new Set([0, last])] : [index];
  const candidate = pose => {
    const nextSequence = clone(source), nextDocument = clone(document);
    if (identity.kind === 'step') for (const value of linkedIndices) nextSequence.steps[value].pose = clone(pose);
    else nextDocument.points[index].pose = clone(pose);
    return { sequence: nextSequence, document: nextDocument, pose: clone(pose) };
  };
  const sample = (state, sampleTime) => {
    const options = transitionOptions(state.document);
    // Empty optional lists must override the live sequence cache as well.
    options.footCurves ??= [];options.skippedSteps ??= [];options.segmentGuides ??= [];
    const frame = motion.sampleTrajectory({ ...options, steps: clone(state.sequence.steps), startTime: sampleTime, endTime: sampleTime, samples: 2 })?.frames?.[0];
    if (!frame?.joints || !Object.hasOwn(frame.joints, joint)) throw new Error('所选关节暂不支持轨迹调整。');
    return vector(frame.joints[joint], '实际关节位置');
  };
  const measure = state => {
    const position = sample(state, time), error = length(subtract(requestedPosition, position));
    if (!Number.isFinite(error)) throw new RangeError('目标距离过大，无法计算轨迹残差。');
    return { ...state, position, error };
  };
  let best = measure({ sequence: clone(source), document: clone(document), pose: clone(originalPose) });
  const initialError = best.error;
  let iterations = 0;
  const improves = trial => trial && trial.error < best.error - Math.max(1e-9, best.error * 1e-8);
  const solve = (base, position) => {
    try {
      const result = motion.solveJointPose(clone(base.pose), { joint, position: clone(position) });
      const coordinate = vector(result?.position, '解算后的关键帧位置');
      return { ...measure(candidate(mergePose(base.pose, result?.pose))), coordinate };
    } catch { return null; } // A locally infeasible direction is not an accepted edit.
  };
  let wrapped = time % source.period;if (wrapped < 0) wrapped += source.period;
  const snapTolerance = Math.min(1e-8, 32 * Number.EPSILON * Math.max(1, source.period, Math.abs(time)));
  const endpointTimes = linked ? anchors.filter(value => value.kind === 'step' && linkedIndices.includes(value.index) && value.active).map(value => value.time) : [selected.time];
  const endpoint = endpointTimes.some(value => Math.abs(wrapped - value) <= snapTolerance || Math.abs(Math.abs(wrapped - value) - source.period) <= snapTolerance);
  if (maxIterations && initialError > GOAL_TOLERANCE) {
    if (endpoint) {
      iterations = 1;const trial = solve(best, requestedPosition);if (improves(trial)) best = trial;
    } else {
      best.coordinate = sample(best, selected.time);
      for (let iteration = 0; iteration < maxIterations && best.error > GOAL_TOLERANCE; iteration++) {
        const columns = [];
        for (let axis = 0; axis < 3; axis++) {
          const plusPosition = clone(best.coordinate), minusPosition = clone(best.coordinate);
          plusPosition[axis] += DIFFERENCE_STEP;minusPosition[axis] -= DIFFERENCE_STEP;
          const plus = solve(best, plusPosition), minus = solve(best, minusPosition);
          columns.push(plus && minus ? subtract(plus.position, minus.position).map(value => value / (2 * DIFFERENCE_STEP))
            : plus ? subtract(plus.position, best.position).map(value => value / DIFFERENCE_STEP)
              : minus ? subtract(best.position, minus.position).map(value => value / DIFFERENCE_STEP) : [0, 0, 0]);
        }
        const step = dampedStep(columns, subtract(requestedPosition, best.position));
        iterations++;let accepted = null;
        if (step && length(step) >= 1e-7) for (const factor of [1, .5, .25, .125]) {
          const position = best.coordinate.map((value, axis) => value + factor * step[axis]);
          const trial = solve(best, position);if (improves(trial)) { accepted = trial;break; }
        }
        if (!accepted) {
          // Floor/reach projection can create a locally flat objective. A small
          // Jacobian cannot distinguish that plateau from no influence. Probe
          // bounded, deterministic alternatives and still accept only a real
          // reduction measured through the complete animation algorithm.
          const residual = subtract(requestedPosition, best.position), magnitude = length(residual);
          const direction = residual.map(value => value / magnitude);
          for (const offset of [.04, -.04, .08, -.08]) {
            const position = best.coordinate.map((value, axis) => value + offset * direction[axis]);
            const trial = solve(best, position);
            if (improves(trial) && (!accepted || trial.error < accepted.error)) accepted = trial;
          }
        }
        if (!accepted) break;
        best = accepted;
      }
    }
  }
  return { sequence: clone(best.sequence), document: clone(best.document), pose: clone(best.pose), anchor: clone(identity), joint, time,
    requestedPosition: clone(requestedPosition), position: clone(best.position), error: best.error, initialError, improved: best.error < initialError, iterations };
}

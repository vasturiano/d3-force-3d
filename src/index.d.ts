import type {
  SimulationNodeDatum as _SimulationNodeDatum,
  SimulationLinkDatum,
  Simulation as _Simulation,
  Force,
  ForceCenter,
  forceCenter,
  ForceCollide,
  forceCollide,
  ForceLink,
  forceLink,
  ForceManyBody,
  forceManyBody,
  ForceRadial,
  forceRadial,
  ForceX,
  forceX,
  ForceY,
  forceY,
} from 'd3-force';

export {
  SimulationLinkDatum,
  Force,
  ForceCenter,
  forceCenter,
  ForceCollide,
  forceCollide,
  ForceLink,
  forceLink,
  ForceManyBody,
  forceManyBody,
  ForceRadial,
  forceRadial,
  ForceX,
  forceX,
  ForceY,
  forceY,
};

type Dimensions = 1 | 2 | 3;

export interface SimulationNodeDatum extends _SimulationNodeDatum {
  /**
   * Node’s current z-position
   */
  z?: number | undefined;
  /**
   * Node’s current z-velocity
   */
  vz?: number | undefined;
  /**
   * Node’s fixed z-position (if position was fixed)
   */
  fz?: number | null | undefined;
}

/**
 * Create a new simulation with the specified array of nodes and no forces.
 * If nodes is not specified, it defaults to the empty array.
 * The simulator starts automatically; use simulation.on to listen for tick events as the simulation runs.
 * If you wish to run the simulation manually instead, call simulation.stop, and then call simulation.tick as desired.
 *
 * Use this signature, when creating a simulation WITHOUT link force(s).
 *
 * The generic refers to the type of the data for a node.
 *
 * @param nodesData Optional array of nodes data, defaults to empty array.
 */
export function forceSimulation<NodeDatum extends SimulationNodeDatum>(
  nodesData?: NodeDatum[],
  numDimensions?: Dimensions
): Simulation<NodeDatum, undefined>;
/**
 * Create a new simulation with the specified array of nodes and no forces.
 * If nodes is not specified, it defaults to the empty array.
 * The simulator starts automatically; use simulation.on to listen for tick events as the simulation runs.
 * If you wish to run the simulation manually instead, call simulation.stop, and then call simulation.tick as desired.
 *
 * Use this signature, when creating a simulation WITH link force(s).
 *
 * The first generic refers to the type of data for a node.
 * The second generic refers to the type of data for a link.
 *
 * @param nodesData Optional array of nodes data, defaults to empty array.
 */
export function forceSimulation<
  NodeDatum extends SimulationNodeDatum,
  LinkDatum extends SimulationLinkDatum<NodeDatum>
>(
  nodesData?: NodeDatum[],
  numDimensions?: Dimensions
): Simulation<NodeDatum, LinkDatum>;

/**
 * A Force Simulation
 *
 * The first generic refers to the type of the datum associated with a node in the simulation.
 * The second generic refers to the type of the datum associated with a link in the simulation, if applicable.
 */
export interface Simulation<
  NodeDatum extends SimulationNodeDatum,
  LinkDatum extends SimulationLinkDatum<NodeDatum> | undefined
> extends _Simulation<NodeDatum, LinkDatum> {
  /**
   * Return the current dimensions of the simulation, which defaults to 2.
   */
  numDimensions(): Dimensions;
  /**
   * Sets the simulation’s number of dimensions to use (1, 2 or 3) and return this simulation.
   * The default is 2.
   *
   * A one-dimensional simulation will only consider and manipulate the x and vx coordinate attributes,
   * while a two-dimensional will extend the domain to y and vy, and a three-dimensional to z and vz.
   *
   * @param nDim Current dimensions of simulation.
   */
  numDimensions(nDim: Dimensions): this;
}

/**
 * The z-positioning force pushes nodes towards a desired position along the given dimension with a configurable strength.
 * The strength of the force is proportional to the one-dimensional distance between the node’s position and the target position.
 * While this force can be used to position individual nodes, it is intended primarily for global forces that apply to all (or most) nodes.
 *
 * The generic refers to the type of data for a node.
 */
export interface ForceZ<NodeDatum extends SimulationNodeDatum>
  extends Force<NodeDatum, any> {
  /**
   * Supplies the array of nodes and random source to this force. This method is called when a force is bound to a simulation via simulation.force
   * and when the simulation’s nodes change via simulation.nodes.
   *
   * A force may perform necessary work during initialization, such as evaluating per-node parameters, to avoid repeatedly performing work during each application of the force.
   */
  initialize(nodes: NodeDatum[], random: () => number): void;

  /**
   *  Returns the current strength accessor, which defaults to a constant strength for all nodes of 0.1.
   */
  strength(): (d: NodeDatum, i: number, data: NodeDatum[]) => number;
  /**
   * Set the strength accessor to the specified constant strength for all nodes, re-evaluates the strength accessor for each node, and returns this force.
   *
   * The strength determines how much to increment the node’s z-velocity: (z - node.z) × strength.
   *
   * For example, a value of 0.1 indicates that the node should move a tenth of the way from its current z-position to the target z-position with each application.
   * Higher values moves nodes more quickly to the target position, often at the expense of other forces or constraints.
   *
   * A value outside the range [0,1] is not recommended.
   *
   * The constant is internally wrapped into a strength accessor function.
   *
   * The strength accessor is invoked for each node in the simulation, being passed the node, its zero-based index and the complete array of nodes.
   * The resulting number is then stored internally, such that the strength of each node is only recomputed when the force is initialized or
   * when this method is called with a new strength, and not on every application of the force.
   *
   * @param strength Constant value of strength to be used for all nodes.
   */
  strength(strength: number): this;
  /**
   * Set the strength accessor to the specified function, re-evaluates the strength accessor for each node, and returns this force.
   *
   * The strength determines how much to increment the node’s z-velocity: (z - node.z) × strength.
   *
   * For example, a value of 0.1 indicates that the node should move a tenth of the way from its current z-position to the target z-position with each application.
   * Higher values moves nodes more quickly to the target position, often at the expense of other forces or constraints.
   *
   * A value outside the range [0,1] is not recommended.
   *
   * The strength accessor is invoked for each node in the simulation, being passed the node, its zero-based index and the complete array of nodes.
   * The resulting number is then stored internally, such that the strength of each node is only recomputed when the force is initialized or
   * when this method is called with a new strength, and not on every application of the force.
   *
   * @param strength A strength accessor function which is invoked for each node in the simulation, being passed the node, its zero-based index and the complete array of nodes.
   * The function returns the strength.
   */
  strength(
    strength: (d: NodeDatum, i: number, data: NodeDatum[]) => number
  ): this;

  /**
   * Return the current z-accessor, which defaults to a function returning 0 for all nodes.
   */
  z(): (d: NodeDatum, i: number, data: NodeDatum[]) => number;
  /**
   * Set the z-coordinate accessor to the specified number, re-evaluates the z-accessor for each node,
   * and returns this force.
   *
   * The constant is internally wrapped into an z-coordinate accessor function.
   *
   * The z-accessor is invoked for each node in the simulation, being passed the node, its zero-based index and the complete array of nodes.
   * The resulting number is then stored internally, such that the target z-coordinate of each node is only recomputed when the force is initialized or
   * when this method is called with a new z, and not on every application of the force.
   *
   * @param z Constant z-coordinate to be used for all nodes.
   */
  z(z: number): this;
  /**
   * Set the z-coordinate accessor to the specified function, re-evaluates the z-accessor for each node,
   * and returns this force.
   *
   * The z-accessor is invoked for each node in the simulation, being passed the node, its zero-based index and the complete array of nodes.
   * The resulting number is then stored internally, such that the target z-coordinate of each node is only recomputed when the force is initialized or
   * when this method is called with a new z, and not on every application of the force.
   *
   * @param z A z-coordinate accessor function which is invoked for each node in the simulation, being passed the node, its zero-based index and the complete array of nodes.
   * The function returns the z-coordinate.
   */
  z(z: (d: NodeDatum, i: number, data: NodeDatum[]) => number): this;
}

/**
 * Create a new positioning force along the z-axis towards the given position z which is defaulted to a constant 0 for all nodes.
 *
 * The z-positioning force pushes nodes towards a desired position along the given dimension with a configurable strength.
 * The strength of the force is proportional to the one-dimensional distance between the node’s position and the target position.
 * While this force can be used to position individual nodes, it is intended primarily for global forces that apply to all (or most) nodes.
 *
 * The generic refers to the type of data for a node.
 */
export function forceZ<
  NodeDatum extends SimulationNodeDatum
>(): ForceZ<NodeDatum>;
/**
 * Create a new positioning force along the z-axis towards the given position z which is constant for all nodes.
 *
 * The z-positioning force pushes nodes towards a desired position along the given dimension with a configurable strength.
 * The strength of the force is proportional to the one-dimensional distance between the node’s position and the target position.
 * While this force can be used to position individual nodes, it is intended primarily for global forces that apply to all (or most) nodes.
 *
 * The generic refers to the type of data for a node.
 *
 * @param z Constant z-coordinate to be used for all nodes.
 */
export function forceZ<NodeDatum extends SimulationNodeDatum>(
  z: number
): ForceZ<NodeDatum>;
/**
 * Create a new positioning force along the z-axis towards the position z given by evaluating the specified z-coordinate accessor
 * for each node.
 *
 * The z-positioning force pushes nodes towards a desired position along the given dimension with a configurable strength.
 * The strength of the force is proportional to the one-dimensional distance between the node’s position and the target position.
 * While this force can be used to position individual nodes, it is intended primarily for global forces that apply to all (or most) nodes.
 *
 * The generic refers to the type of data for a node.
 *
 * @param z A z-coordinate accessor function which is invoked for each node in the simulation, being passed the node and its zero-based index.
 * The function returns the z-coordinate.
 */
export function forceZ<NodeDatum extends SimulationNodeDatum>(
  z: (d: NodeDatum, i: number, data: NodeDatum[]) => number
): ForceZ<NodeDatum>;

declare module 'd3-force-3d' {
  export function forceCenter(x?: number, y?: number, z?: number): ForceCenter;

  export function forceCollide(
    radius?:
      | number
      | ((node: NodeData, index: number, nodes: NodeData[]) => number)
  ): ForceCollide;

  export function forceLink(links?: LinkData[]): ForceLink;

  export function forceManyBody(): ForceManyBody;

  export function forceRadial(
    radius?:
      | number
      | ((node: NodeData, index: number, nodes: NodeData[]) => number),
    x?: number,
    y?: number,
    z?: number
  ): ForceRadial;

  export function forceSimulation(
    nodes?: NodeData[],
    numDimensions?: Dimensions
  ): ForceSimulation;

  export function forceX(x?: number): ForceX;

  export function forceY(y?: number): ForceY;

  export function forceZ(z?: number): ForceZ;

  interface ForceSimulation {
    tick(iterations?: number): this;

    restart(): this;

    stop(): this;

    numDimensions(): Dimensions;
    numDimensions(value: Dimensions): this;

    nodes(): NodeData[];
    nodes(nodes: NodeData[]): this;

    alpha(): number;
    alpha(alpha: number): this;

    alphaMin(): number;
    alphaMin(min: number): this;

    alphaDecay(): number;
    alphaDecay(decay: number): this;

    alphaTarget(): number;
    alphaTarget(target: number): this;

    velocityDecay(): number;
    velocityDecay(decay: number): this;

    randomSource(): () => number;
    randomSource(source: () => number): this;

    force<T extends Force = Force>(name: string): T;
    force(name: string, force: Force | null): this;

    find(x?: number, y?: number, z?: number, radius?: number): NodeData;

    on(name: string): (...args: any[]) => void;
    on(name: string, listener: (...args: any[]) => void): this;
  }

  type Force =
    | ForceCenter
    | ForceCollide
    | ForceLink
    | ForceManyBody
    | ForceRadial
    | ForceX
    | ForceY
    | ForceZ;

  interface ForceCenter {
    (): void;

    initialize(nodes: NodeData[]): void;

    x(): number;
    x(x: number): this;

    y(): number;
    y(y: number): this;

    z(): number;
    z(z: number): this;

    strength(): number;
    strength(strength: number): this;
  }

  interface ForceCollide {
    (): void;

    initialize(
      nodes: NodeData[],
      random?: () => number,
      nDim?: Dimensions
    ): void;

    iterations(): number;
    iterations(iterations: number): this;

    strength(): number;
    strength(strength: number): this;

    radius(): number;
    radius(
      radius:
        | number
        | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;
  }

  interface ForceLink {
    (alpha: number): void;

    initialize(nodes: NodeData[], random: () => number, dim: Dimensions): void;

    links(): LinkData[];
    links(links: LinkData[]): this;

    id(): (node: NodeData, index: number, nodes: NodeData[]) => any;
    id(id: (node: NodeData, index: number, nodes: NodeData[]) => any): this;

    iterations(): number;
    iterations(iterations: number): this;

    strength(): (link: LinkData, index: number, links: LinkData[]) => number;
    strength(
      strength:
        | number
        | ((link: LinkData, index: number, links: LinkData[]) => number)
    ): this;

    distance(): (link: LinkData, index: number, links: LinkData[]) => number;
    distance(
      distance:
        | number
        | ((link: LinkData, index: number, links: LinkData[]) => number)
    ): this;
  }

  interface ForceManyBody {
    (alpha: number): void;

    initialize(nodes: NodeData[], random: () => number, dim: Dimensions): void;

    strength(): (node: NodeData, index: number, nodes: NodeData[]) => number;
    strength(
      strength:
        | number
        | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;

    distanceMin(): number;
    distanceMin(min: number): this;

    distanceMax(): number;
    distanceMax(max: number): this;

    theta(): number;
    theta(theta: number): this;
  }

  interface ForceRadial {
    (alpha: number): void;

    initialize(nodes: NodeData[], dim: Dimensions): void;

    strength(): (node: NodeData, index: number, nodes: NodeData[]) => number;
    strength(
      strength:
        | number
        | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;

    radius(): (node: NodeData, index: number, nodes: NodeData[]) => number;
    radius(
      radius:
        | number
        | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;

    x(): number;
    x(x: number): this;

    y(): number;
    y(y: number): this;

    z(): number;
    z(z: number): this;
  }

  interface ForceX {
    (alpha: number): void;

    initialize(nodes: NodeData[]): void;

    strength(): number;
    strength(
      strength:
        | number
        | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;

    x(): number;
    x(
      x: number | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;
  }

  interface ForceY {
    (alpha: number): void;

    initialize(nodes: NodeData[]): void;

    strength(): number;
    strength(
      strength:
        | number
        | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;

    y(): number;
    y(
      y: number | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;
  }

  interface ForceZ {
    (alpha: number): void;

    initialize(nodes: NodeData[]): void;

    strength(): number;
    strength(
      strength:
        | number
        | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;

    z(): number;
    z(
      z: number | ((node: NodeData, index: number, nodes: NodeData[]) => number)
    ): this;
  }

  interface NodeData {
    /** the node’s zero-based index into nodes */
    index?: number;
    /** the node’s current x-position */
    x?: number;
    /** the node’s current y-position (if using 2 or more dimensions) */
    y?: number;
    /** the node’s current z-position (if using 3 dimensions) */
    z?: number;
    /** the node’s current x-velocity */
    vx?: number;
    /** the node’s current y-velocity (if using 2 or more dimensions) */
    vy?: number;
    /** the node’s current z-velocity (if using 3 dimensions) */
    vz?: number;
    /** the node’s fixed x-position */
    fx?: number;
    /** the node’s fixed y-position */
    fy?: number;
    /** the node’s fixed z-position */
    fz?: number;
    [key: string]: any;
  }

  interface LinkData {
    /** the zero-based index into links, assigned by this method */
    index?: number;
    /** the link’s source node */
    source: NodeData | any;
    /** the link’s target node */
    target: NodeData | any;
    [key: string]: any;
  }

  type Dimensions = 1 | 2 | 3;
}

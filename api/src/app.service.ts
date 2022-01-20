import { Injectable } from '@nestjs/common';

interface Node {
  id: number;
  type: string;
  label: string;
  level?: number;
  state?: number;
  x?: number;
  y?: number;
}

interface Link {
  id: number;
  from: number;
  to: number;
  weight?: number;
}

export interface DataScheme {
  nodes: Node[];
  links: Link[];
}

const sampleData: DataScheme = {
  nodes: [
    { id: 1, type: 'asset', label: 'КЕ1-ШЛЮЗ1', x: -226, y: 99 },
    { id: 2, type: 'asset', label: 'КЕ2-ФАЕР1', x: -467, y: 298 },
    { id: 3, type: 'asset', label: 'КЕ3-МАРШ1', x: -225, y: 291 },
    { id: 4, type: 'asset', label: 'КЕ4-ХОСТ1', x: -359, y: 464 },
    { id: 5, type: 'asset', label: 'КЕ5-ХОСТ2', x: -91, y: 468 },
    {
      id: 6,
      type: 'incident',
      label: 'Инцидент 1',
      level: 1,
      x: -388,
      y: -63,
    },
    {
      id: 7,
      type: 'incident',
      label: 'Инцидент 2',
      level: 0.7,
      x: -225,
      y: -64,
    },
    {
      id: 8,
      type: 'incident',
      label: 'Инцидент 3',
      level: 0.7,
      x: -57,
      y: -62,
    },
    {
      id: 9,
      type: 'incident',
      label: 'Инцидент 4',
      level: 0.5,
      x: -656,
      y: 155,
    },
    {
      id: 10,
      type: 'incident',
      label: 'Инцидент 5',
      level: 0.3,
      x: 71,
      y: 151,
    },
  ],
  links: [
    { id: 11, from: 6, to: 1 },
    { id: 12, from: 7, to: 1 },
    { id: 13, from: 8, to: 1 },
    { id: 14, from: 9, to: 2 },
    { id: 19, from: 10, to: 3 },
    { id: 15, from: 1, to: 2, weight: 0.2 },
    { id: 16, from: 1, to: 3, weight: 0.8 },
    { id: 17, from: 3, to: 4, weight: 0.5 },
    { id: 18, from: 3, to: 5, weight: 0.0 },
    { id: 20, from: 2, to: 4, weight: 0.7 },
  ],
};

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getData(): DataScheme {
    return sampleData;
  }

  calc(data: DataScheme) {
    for (const node of data.nodes.filter((n) => n.type === 'asset')) {
      node.state = Number(this.calcNode(node, data).toFixed(4));
    }

    return data;
  }

  private calcNode(node: Node, data: DataScheme): number {
    if (node.type === 'incident') {
      return node.level;
    } else if (node.type === 'asset') {
      if (node.state) {
        return node.state;
      }
      const linksToNode = data.links.filter((l) => l.to === node.id);
      const states = [];
      for (const link of linksToNode) {
        const fromNode = data.nodes.find((n) => n.id === link.from);
        const nodeState = this.calcNode(fromNode, data);
        states.push({
          state: nodeState,
          weight: link.weight === undefined ? 1 : link.weight,
        });
      }
      return (
        1 - states.reduce((p, { state, weight }) => p * (1 - state * weight), 1)
      );
    }
  }
}

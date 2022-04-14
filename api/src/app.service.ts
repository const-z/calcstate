import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid/async';

import { AffectsNode, DataScheme, Node } from './calc-state.service';
import { StoreService } from './store.service';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5);

// const sampleData: DataScheme = {
//   nodes: [
//     { id: 1, type: 'asset', label: 'КЕ1-ШЛЮЗ1', x: -226, y: 99 },
//     { id: 2, type: 'asset', label: 'КЕ2-ФАЕР1', x: -467, y: 298 },
//     { id: 3, type: 'asset', label: 'КЕ3-МАРШ1', x: -225, y: 291 },
//     { id: 4, type: 'asset', label: 'КЕ4-ХОСТ1', x: -359, y: 464 },
//     { id: 5, type: 'asset', label: 'КЕ5-ХОСТ2', x: -91, y: 468 },
//     {
//       id: 6,
//       type: 'incident',
//       label: 'Инцидент 1',
//       level: 1,
//       x: -388,
//       y: -63,
//     },
//     {
//       id: 7,
//       type: 'incident',
//       label: 'Инцидент 2',
//       level: 0.7,
//       x: -225,
//       y: -64,
//     },
//     {
//       id: 8,
//       type: 'incident',
//       label: 'Инцидент 3',
//       level: 0.7,
//       x: -57,
//       y: -62,
//     },
//     {
//       id: 9,
//       type: 'incident',
//       label: 'Инцидент 4',
//       level: 0.5,
//       x: -656,
//       y: 155,
//     },
//     {
//       id: 10,
//       type: 'incident',
//       label: 'Инцидент 5',
//       level: 0.3,
//       x: 71,
//       y: 151,
//     },
//   ],
//   links: [
//     { id: 11, from: 6, to: 1 },
//     { id: 12, from: 7, to: 1 },
//     { id: 13, from: 8, to: 1 },
//     { id: 14, from: 9, to: 2 },
//     { id: 19, from: 10, to: 3 },
//     { id: 15, from: 1, to: 2, weight: 0.2 },
//     { id: 16, from: 1, to: 3, weight: 0.8 },
//     { id: 17, from: 3, to: 4, weight: 0.5 },
//     { id: 18, from: 3, to: 5, weight: 0.0 },
//     { id: 20, from: 2, to: 4, weight: 0.7 },
//   ],
// };

@Injectable()
export class AppService {
  // private readonly storeName = 'test';

  async generateBigData(storeName: string) {
    const store = new StoreService(storeName);
    const count = 10000;

    await store.saveNodes([], true);
    await store.saveLinks([], true);

    for (let i = 1; i <= count; i++) {
      const node = {
        id: i,
        type: 'asset',
        label: `Актив ${i}`,
        x: 0,
        y: i * 10,
      };

      await store.saveNodes([node]);

      if (i < count) {
        const link = {
          id: count + node.id,
          from: node.id,
          to: node.id + 1,
          weight: 0.5,
        };
        await store.saveLinks([link]);
      }
    }

    await store.saveNodes([
      {
        id: 10001,
        type: 'incident',
        label: 'Инцидент 1',
        level: 0.8,
        x: -288,
        y: -63,
      },
      {
        id: 10002,
        type: 'incident',
        label: 'Инцидент 2',
        level: 0.8,
        x: -288,
        y: -63,
      },
    ]);

    await store.saveLinks([
      {
        id: count + 10001,
        from: 10001,
        to: 1,
      },
      {
        id: count + 10002,
        from: 10002,
        to: 1,
      },
    ]);
  }

  async getUniqueStoreName() {
    let id;
    let exists = true;
    do {
      id = `db_${await nanoid()}`;
      const store = new StoreService(id);
      exists = await store.checkExists();
    } while (exists);

    return id;
  }

  async getData(storeName: string): Promise<DataScheme> {
    const store = new StoreService(storeName);
    const nodes = await store.getNodes();
    const links = await store.getLinks();

    return {
      nodes,
      links,
    };
  }

  async calc(storeName: string, { id }: { id?: string | number }) {
    for (let i = 0; i < 10; i++) {
      await this.calcAffectedNodes(storeName, id);
    }
  }

  async save(storeName: string, schema: DataScheme) {
    const store = new StoreService(storeName);
    await store.saveNodes(schema.nodes, true);
    await store.saveLinks(schema.links, true);
  }

  async calcNodeState(
    storeName: string,
    nodeId?: string | number,
  ): Promise<number> {
    const store = new StoreService(storeName);
    const nodes = await store.getAffectsToNode(nodeId);

    let state = 1;

    for (const n of nodes) {
      let nState = n.state;
      if (nState === null && n.weight > 0) {
        nState = await this.calcNodeState(storeName, n.id);
      }
      state = state * (1 - nState * n.weight);
    }

    state = 1 - state;

    await store.updateNode(nodeId, { state: Number(state.toFixed(2)) });

    return state;
  }

  async calcAffectedNodes(storeName: string, nodeId: string | number) {
    const store = new StoreService(storeName);
    let affected: Node[];

    if (nodeId) {
      affected = await store.getAffectedNodes(nodeId);
      affected.unshift({ id: nodeId } as Node);
    } else {
      affected = (await store.getNodes()).filter((n) => n.type !== 'incident');
    }

    for (const aNode of affected) {
      const nodes = await store.getAffectsToNode(aNode.id);
      const incidentsInfluence = this.calcIncidentsInfluence(nodes);
      const clustersInfluence = this.calcClustersInfluence(nodes);

      const state =
        1 -
        incidentsInfluence *
          clustersInfluence *
          nodes
            .filter(({ type }) => type !== 'incident')
            .filter(({ link }) => !link.cluster)
            .reduce((p, c) => {
              return p * (1 - c.state * c.weight);
            }, 1);
      await store.updateNode(aNode.id, { state: Number(state.toFixed(4)) });
    }
  }

  calcClustersInfluence(nodes: AffectsNode[]) {
    const clusters = nodes.filter(({ link }) => Boolean(link.cluster));

    if (!clusters.length) {
      return 1;
    }

    const clustersNodes = clusters.reduce((p, c) => {
      p[c.link.cluster] = (p[c.link.cluster] || []).concat([c]);

      return p;
    }, {});

    const result = this.calcNodesByClusters(clustersNodes);

    return result;
  }

  calcNodesByClusters(clusters: Record<string, AffectsNode[]>) {
    let result = 1;

    for (const [, nodes] of Object.entries(clusters)) {
      result =
        result *
        (1 -
          nodes.reduce((p, c) => {
            return p * (c.state * c.weight);
          }, 1));
    }

    return result;
  }

  calcIncidentsInfluence(nodes: AffectsNode[]) {
    const incidents = nodes
      .filter(({ type }) => type === 'incident')
      .map((inc) => {
        inc.threshold = this.getInfluenceThreshold(inc.level);

        return inc;
      });

    const incThreshold = incidents.reduce((p, c) => {
      p[c.threshold] = (p[c.threshold] || []).concat([c]);

      return p;
    }, {});

    const result = this.calcIncidentsByThreshold(incThreshold);

    return 1 - result;
  }

  calcIncidentsByThreshold(incThreshold: Record<string, AffectsNode[]>) {
    let result = 1;

    for (const [threshold, incidents] of Object.entries(incThreshold)) {
      const pl =
        1 -
        incidents.reduce((p, c) => {
          return p * (1 - c.state * c.weight);
        }, 1);
      result = result * (1 - Number(threshold) * pl);
    }

    return 1 - result;
  }

  getInfluenceThreshold(incidentLevel: number) {
    const lvlThreshold = [
      { from: 0, to: 0.3, v: 0.5 },
      { from: 0.3, to: 0.5, v: 0.7 },
      { from: 0.5, to: 0.7, v: 1 },
      { from: 0.7, to: 1, v: 1 },
    ];

    let result = lvlThreshold[3][1];

    for (const { from, to, v } of lvlThreshold) {
      if (from < incidentLevel && to >= incidentLevel) {
        result = v;
      }
    }

    return result;
  }
}

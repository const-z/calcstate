import { Injectable } from '@nestjs/common';
import { CalcStateService, DataScheme, Node } from './calc-state.service';
import { StoreService } from './store.service';

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
  private readonly storeName = 'bigdata';

  async generateBigData() {
    const store = new StoreService(this.storeName);
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

  async getData(): Promise<DataScheme> {
    const store = new StoreService(this.storeName);
    const [nodes, links] = await Promise.all([
      store.getNodes(),
      store.getLinks(),
    ]);

    return {
      nodes,
      links,
    };
  }

  async calc({ id }: { id?: string | number }) {
    // const store = new StoreService(this.storeName);
    // const node = await store.getNodeById(10000);
    // const schema = await this.getData();

    // CalcStateService.calcNode(node, schema);

    // return node;
    console.time('CALC');
    // const state = await this.calcNodeState(id);
    const state = await this.calcAffectedNodes(id);
    console.log('STATE', state);

    const data = this.getData();
    console.timeEnd('CALC');

    return data;
  }

  async save(schema: DataScheme) {
    const store = new StoreService(this.storeName);
    await store.saveNodes(schema.nodes, true);
    await store.saveLinks(schema.links, true);
  }

  async calcNodeState(nodeId?: string | number): Promise<number> {
    const store = new StoreService(this.storeName);
    const nodes = await store.getAffectsToNode(nodeId);

    let state = 1;

    for (const n of nodes) {
      let nState = n.state;
      if (nState === null && n.weight > 0) {
        nState = await this.calcNodeState(n.id);
      }
      state = state * (1 - nState * n.weight);
    }

    state = 1 - state;

    await store.updateNode(nodeId, { state: Number(state.toFixed(2)) });

    return state;
  }

  async calcAffectedNodes(nodeId: string | number) {
    const store = new StoreService(this.storeName);
    let affected: Node[];

    if (nodeId) {
      affected = await store.getAffectedNodes(nodeId);
      affected.unshift({ id: nodeId } as Node);
    } else {
      affected = (await store.getNodes()).filter((n) => n.type !== 'incident');
    }

    for (const aNode of affected) {
      const nodes = await store.getAffectsToNode(aNode.id);
      const state =
        1 -
        nodes.reduce((p, c) => {
          return p * (1 - c.state * c.weight);
        }, 1);
      await store.updateNode(aNode.id, { state: Number(state.toFixed(2)) });
    }
  }
}

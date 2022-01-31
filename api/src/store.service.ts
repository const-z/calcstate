import { CollectionType, Database } from 'arangojs';
import { AffectsNode, Link, Node } from './calc-state.service';

export class StoreService {
  private db: Database;
  private nodesCollectionName: string;
  private edgesCollectionName: string;

  constructor(private readonly storeName: string) {
    this.db = new Database({ url: 'http://arangodb:8529' });
    this.nodesCollectionName = `${this.storeName}_node`;
    this.edgesCollectionName = `${this.storeName}_edge`;
  }

  async getForCalc(id: string | number) {
    const nodeId = `${this.nodesCollectionName}/${id}`;

    const nodes = await (
      await this.db.query({
        query: `
          LET rootId = @nodeId
          LET affected = (FOR v IN 1..10000 OUTBOUND rootId @@edgesCollection RETURN DISTINCT v._id)


          FOR nodeId IN APPEND([rootId], affected)
            LET d = DOCUMENT(nodeId)
            LET a = (
              FOR node, link IN 1..1 INBOUND nodeId @@edgesCollection
                LET p = node.type == "incident" ? { state: node.level, weight: 1 } : { state: node.state, weight: link.weight }
                RETURN { _id: node._id, _key: node._key, weight: p.weight, state: p.state, type: node.type }
            )

            RETURN { _id: nodeId, _key: d._key, state: d.state, "inbound": a }
        `,
        bindVars: {
          '@edgesCollection': this.edgesCollectionName,
          nodeId,
        },
      })
    ).all();

    return nodes;
  }

  async updateNode(id: string | number, data: any) {
    const collection = await this.getCollection(
      CollectionType.DOCUMENT_COLLECTION,
    );
    const nodeId = `${this.nodesCollectionName}/${id}`;
    await collection.update({ _id: nodeId }, data, { silent: true });
  }

  async getNodeById(id) {
    const nodeId = `${this.nodesCollectionName}/${id}`;

    const data = await (
      await this.db.query({
        query: 'RETURN DOCUMENT(@nodeId)',
        bindVars: { nodeId },
      })
    ).next();

    return data;
  }

  async getNodes() {
    await Promise.all([
      this.getCollection(CollectionType.DOCUMENT_COLLECTION),
      this.getCollection(CollectionType.EDGE_COLLECTION),
    ]);

    const data = await (
      await this.db.query({
        query: 'FOR n IN @@nodesCollection RETURN n',
        bindVars: {
          '@nodesCollection': this.nodesCollectionName,
        },
      })
    ).all();

    return data;
  }

  async getLinks() {
    await Promise.all([
      this.getCollection(CollectionType.DOCUMENT_COLLECTION),
      this.getCollection(CollectionType.EDGE_COLLECTION),
    ]);

    const data = await (
      await this.db.query({
        query: 'FOR n IN @@edgesCollection RETURN n',
        bindVars: {
          '@edgesCollection': this.edgesCollectionName,
        },
      })
    ).all();

    return data;
  }

  async getAffectedNodes(id: string | number): Promise<Node[]> {
    const affected = await (
      await this.db.query({
        query: `FOR node IN 1..10000 OUTBOUND @nodeId @@edgeCollection RETURN node`,
        bindVars: {
          '@edgeCollection': this.edgesCollectionName,
          nodeId: `${this.nodesCollectionName}/${id}`,
        },
      })
    ).all();

    return affected;
  }

  async getAffectsToNode(id: string | number): Promise<AffectsNode[]> {
    const affectsBy = await (
      await this.db.query({
        query: `
          FOR node, link IN 1..1 INBOUND @nodeId @@edgeCollection 
            LET data = node.type == "incident" ? { state: node.level, weight: 1 } : { state: node.state, weight: link.weight }
            RETURN MERGE(node, { link }, data)
        `,
        bindVars: {
          '@edgeCollection': this.edgesCollectionName,
          nodeId: `${this.nodesCollectionName}/${id}`,
        },
      })
    ).all();

    return affectsBy;
  }

  async saveNodes(nodes: Node[], replace = false) {
    const documents = nodes.map((n) => ({
      ...n,
      _key: `${n.id}`,
    }));

    const collection = await this.getCollection(
      CollectionType.DOCUMENT_COLLECTION,
    );

    if (replace) {
      await collection.truncate();
    }

    await collection.saveAll(documents, { overwriteMode: 'update' });
  }

  async saveLinks(links: Link[], replace = false) {
    const edges = links.map((l) => ({
      ...l,
      _key: `${l.from}-${l.to}`,
      _from: `${this.nodesCollectionName}/${l.from}`,
      _to: `${this.nodesCollectionName}/${l.to}`,
    }));

    const collection = await this.getCollection(CollectionType.EDGE_COLLECTION);

    if (replace) {
      await collection.truncate();
    }

    await collection.saveAll(edges, { overwriteMode: 'update' });
  }

  private async getCollection(type: CollectionType) {
    const collectionName =
      CollectionType.DOCUMENT_COLLECTION === type
        ? this.nodesCollectionName
        : this.edgesCollectionName;
    const collection = this.db.collection(collectionName);

    if (!(await collection.exists())) {
      await collection.create({ type });
    }

    return collection;
  }
}

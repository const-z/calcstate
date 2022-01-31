// import { DataScheme, Link, Node } from './calc-state.service';

// export class SchemeGenerator {
//   generateSchema(): DataScheme {
//     const assetCount = 2;
//     const incidentCount = 0;

//     const assets: Node[] = [];
//     const incidents: Node[] = [];
//     let links: Link[] = [];
//     const incidentLevels = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

//     for (let i = 0; i < assetCount; i++) {
//       assets.push({
//         id: i + 1,
//         type: 'asset',
//         label: `Актив ${i + 1}`,
//         x: 0,
//         y: 0,
//       });
//     }

//     for (let i = assetCount; i < assetCount + incidentCount; i++) {
//       const incident = {
//         id: i + 1,
//         type: 'incident',
//         label: `Инцидент ${i - assetCount + 1}`,
//         level: incidentLevels[Math.trunc(Math.random() * 10)],
//         x: 0,
//         y: 0,
//       };
//       const active = assets[Math.trunc(Math.random() * assetCount)];
//       incidents.push(incident);
//       links.push({
//         id: assetCount + incidentCount + incident.id + active.id,
//         from: incident.id,
//         to: active.id,
//       });
//     }

//     links = [...links, ...this.generateSchemaLinks(assets[0], assets)];
//     const nodes = [...assets, ...incidents];
//     nodes.forEach((n) => {
//       n.y = n.y * 150;
//     });

//     return {
//       nodes,
//       links,
//     };
//   }

//   getNext(id, actives: Node[], len = 10) {
//     const result = [];

//     for (let i = 0; i < actives.length; i++) {
//       if (id < actives[i].id) {
//         result.push(actives[i]);
//       }
//       if (result.length === len) {
//         break;
//       }
//     }

//     return result;
//   }

//   generateSchemaLinks(root: Node, actives: Node[], positionYLevel = 0) {
//     const linked: number[] = [];
//     const fromNodes = this.getNext(root.id, actives, 10);
//     const links: Link[] = [];

//     for (let i = 0; i < this.randomIntFromInterval(0, 5); i++) {
//       const idx = this.randomIntFromInterval(0, fromNodes.length - 1);
//       const from = fromNodes[idx];
//       linked.push(from.id);

//       if (!linked.includes(idx) && from) {
//         const l = from
//           ? this.generateSchemaLinks(from, actives, positionYLevel + 1)
//           : [];

//         from.y = root.y > from.y ? root.y + 1 : from.y;
//         links.push({
//           id: actives.length + from.id + root.id,
//           from: from.id,
//           to: root.id,
//         });
//         links.push(...l);
//       }
//     }

//     console.log(`root ${root.id}`, links);

//     return links;
//   }

//   private randomIntFromInterval(min, max) {
//     return Math.floor(Math.random() * (max - min + 1) + min);
//   }
// }

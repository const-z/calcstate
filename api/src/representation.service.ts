// https://www.geeksforgeeks.org/implementation-graph-javascript/

export class RepresentationService {
  private readonly adjList = new Map();
  private readonly noOfVertices = [];

  constructor(noOfVertices) {
    this.noOfVertices = noOfVertices;
  }

  // add vertex to the graph
  addVertex(v) {
    // initialize the adjacent list with a
    // null array
    this.adjList.set(v, []);
  }

  // add edge to the graph
  addEdge(v, w) {
    // get the list for vertex v and put the
    // vertex w denoting edge between v and w
    this.adjList.get(v).push(w);

    // // Since graph is undirected,
    // // add an edge from w to v also
    // this.adjList.get(w).push(v);
  }

  // Prints the vertex and adjacency list
  printGraph() {
    // get all the vertices
    const get_keys = this.adjList.keys();

    // iterate over the vertices
    for (const i of get_keys) {
      // great the corresponding adjacency list
      // for the vertex
      const get_values = this.adjList.get(i);
      let conc = '';

      // iterate over the adjacency list
      // concatenate the values into a string
      for (const j of get_values) conc += j + ' ';

      // print the vertex and its adjacency list
      console.log(i + ' -> ' + conc);
    }
  }
}

const addHiddenLayer = Symbol('addHiddenLayer');
const addOutputLayer = Symbol('addOutputLayer');

function sigmoid(x) {
	/*
	 *		Activation-Function
	 */
	return 1 / (1 + Math.exp(-x));
}

function dsigmoid(y) {
	return y * (1 - y);
}

// NeuralNetwork Klasse
class NeuralNetwork {
	constructor() {
		this.inputNodes = 0; // anzahl der Input-nodes
		this.hiddenLayerNodes = []; // Array welches die anzahl der nodes für jd. hL speichert
		this.hiddenLayers = []; // init für das array mit den hiddenLayer objekten
		this.numHiddenLayers = 0; // anzahl der hiddenLayer
		this.outputNodes = 0; // anzahl der outputNodes
		this.outputLayer; // init für das OutputLayer objekt

		this.learningRate = 0.1; // Preset für die learningRate
	}

	addLayers(layerArray) {
		/*
		 *		Funktion die es für den User einfacher macht sein Network aufzustellen.
		 *		Eine Art redirect zu den spezifischeren Funktionen.
		 */
		for (let i = 0; i < layerArray.length; i++) {
			let layer = layerArray[i];
			if (layer.type == "input") {
				this.inputNodes = layer.nodes;
			} else if (layer.type == "hidden") {
				this[addHiddenLayer](layer);
			} else if (layer.type == "output") {
				this[addOutputLayer](layer);
			} else {
				console.error('Invalid layertype: ' + layer.type);
			}
		}
	}

	[addHiddenLayer](layer) {
		this.hiddenLayerNodes[this.numHiddenLayers] = layer.nodes;
		if (this.numHiddenLayers == 0) { // check if this is the first hidden layer
			this.hiddenLayers[this.numHiddenLayers] = new HiddenLayer(this.inputNodes, this.hiddenLayerNodes[this.numHiddenLayers]);
		} else {
			this.hiddenLayers[this.numHiddenLayers] = new HiddenLayer(this.hiddenLayerNodes[this.numHiddenLayers - 1], this.hiddenLayerNodes[this.numHiddenLayers]);
		}
		this.numHiddenLayers++;
	}

	[addOutputLayer](layer) {
		this.outputNodes = layer.nodes;
		this.outputLayer = new OutputLayer(this.hiddenLayerNodes[this.numHiddenLayers - 1], this.outputNodes);
	}

	predict(inputArray) {
		/*
		 *		Diese Funktion ist ein feed-forward Algorythmus durch das Netzwerk.
		 */
		if (inputArray.length != this.inputNodes) {
			console.error(`Number of given inputs (${inputArray.length}) does not match up with number of input nodes (${this.inputNodes}).`);
			return;
		}

		let inputs = Matrix.fromArray(inputArray);
		let hidden = Matrix.multiply(this.hiddenLayers[0].w_f_t, inputs);
		hidden.add(this.hiddenLayers[0].biases);
		hidden.map(sigmoid);

		for (let i = 1; i < this.hiddenLayers.length; i++) {
			hidden = Matrix.multiply(this.hiddenLayers[i].w_f_t, hidden);
			hidden.add(this.hiddenLayers[i].biases);
			hidden.map(sigmoid);
		}

		let output = Matrix.multiply(this.outputLayer.w_f_t, hidden);
		output.add(this.outputLayer.biases);
		output.map(sigmoid);

		/*
		 *		Gibt den Output als Array zurück, z.B:
		 *		 -> [0.394762547395, 0.614494783527]
		 */

		return output.toArray();

	}

	train(inputArray, targetArray, iterations = 10000) {
		/*
		 *		Ein backwards-propagation Algorythmus der einen Input und ein gewünschtes Ergebnis
		 *		als Array nimmt und über eine optionale Anzahl (default 10000) an iterations das Training durchführt
		 */
		if (inputArray.length != this.inputNodes) {
			console.error(`Number of given inputs (${inputArray.length}) does not match up with number of input nodes (${this.inputNodes}).`);
			return;
		} else if (targetArray.length != this.outputNodes) {
			console.error(`Number of given targets (${targetArray.length}) does not match up with number of output nodes (${this.outputNodes}).`);
		}

		let inputs = Matrix.fromArray(inputArray);
		let hidden = Matrix.multiply(this.hiddenLayers[0].w_f_t, inputs);
		hidden.add(this.hiddenLayers[0].biases);
		hidden.map(sigmoid);
		this.hiddenLayers[0].values = hidden;

		for (let i = 1; i < this.hiddenLayers.length; i++) {
			hidden = Matrix.multiply(this.hiddenLayers[i].w_f_t, hidden);
			hidden.add(this.hiddenLayers[i].biases);
			hidden.map(sigmoid);
			this.hiddenLayers[i].values = hidden;
		}

		let outputs = Matrix.multiply(this.outputLayer.w_f_t, hidden);
		outputs.add(this.outputLayer.biases);
		outputs.map(sigmoid);
		let targets = Matrix.fromArray(targetArray);

		// Hier kommt das Training (w.i.P.)

		// Calculate the output error
		// ERROR = TARGETS - OUTPUTS
		let outputError = Matrix.subtract(targets, outputs);

		let gradient = Matrix.map(outputs, dsigmoid);
		gradient.multiply(outputError);
		gradient.multiply(this.learningRate);

		let hidden_t = Matrix.transpose(this.hiddenLayers[this.numHiddenLayers - 1].values);

		let weights_ho_deltas = Matrix.multiply(gradient, hidden_t);

		this.outputLayer.w_f_t.add(weights_ho_deltas);
		// TODO: biases !

		// Calculate the last hiddenLayer error
		let w_ho_t = Matrix.transpose(this.outputLayer.w_f_t);
		let hiddenErrors = Matrix.multiply(w_ho_t, outputError);
		// TODO: gradient for the last hidden layer

		// TODO: Check if this is correct
		for (let i = this.numHiddenLayers - 1; i > 0; i--) {
			let weights_t = Matrix.transpose(this.hiddenLayers[i].w_f_t);
			hiddenErrors = Matrix.multiply(weights_t, hiddenErrors);
			hiddenErrors.print();
			// TODO: back-prop for the remaining layers
		}
	}

	mutate(rate) {
		/*
		 *		Ein genetischer Algorythmus soll eine Population über Generationen mutieren und trainiert werden.
		 */
		console.error('Feature not implemented yet');
		return;
	}
}

class HiddenLayer {
	/*
	 *		Template für einen HiddenLayer
	 */
	constructor(nodesInFront, numOfNodes) {
		this.w_f_t = new Matrix(numOfNodes, nodesInFront);
		this.w_f_t.randomize();
		this.biases = new Matrix(numOfNodes, 1);
		this.biases.randomize();
		this.values = new Matrix(numOfNodes, 1);
	}
}

class OutputLayer {
	/*
	 *		Template für einen OutputLayer
	 */
	constructor(nodesInFront, numOfNodes) {
		this.w_f_t = new Matrix(numOfNodes, nodesInFront);
		this.w_f_t.randomize();
		this.biases = new Matrix(numOfNodes, 1);
		this.biases.randomize();
	}
}

class Matrix {
	/*
	 *		matrix.js Library von Daniel Shiffmann (github.com/shiffmann)
	 */
	constructor(r, c) {
		this.rows = r;
		this.cols = c;
		this.data = [];

		for (let i = 0; i < this.rows; i++) {
			this.data[i] = [];
			for (let j = 0; j < this.cols; j++) {
				this.data[i][j] = 0;
			}
		}
	}

	static fromArray(arr) {
		let m = new Matrix(arr.length, 1);
		for (let i = 0; i < arr.length; i++) {
			m.data[i][0] = arr[i];
		}
		return m;
	}

	static multiply(a, b) {
		// Matrix Product
		if (a.cols !== b.rows) {
			console.error('Cols of A must match rows of B.');
			return undefined;
		}
		let result = new Matrix(a.rows, b.cols);
		for (let i = 0; i < result.rows; i++) {
			for (let j = 0; j < result.cols; j++) {
				// Dot Product of values in col
				let sum = 0;
				for (let k = 0; k < a.cols; k++) {
					sum += a.data[i][k] * b.data[k][j];
				}
				result.data[i][j] = sum;
			}
		}
		return result;
	}

	static subtract(a, b) {
		let result = new Matrix(a.rows, a.cols);
		for (let i = 0; i < a.rows; i++) {
			for (let j = 0; j < a.cols; j++) {
				result.data[i][j] = a.data[i][j] - b.data[i][j];
			}
		}
		return result;
	}

	static transpose(matrix) {
		let result = new Matrix(matrix.cols, matrix.rows);
		for (let i = 0; i < matrix.rows; i++) {
			for (let j = 0; j < matrix.cols; j++) {
				result.data[j][i] = matrix.data[i][j];
			}
		}
		return result;
	}

	static map(matrix, func) {
		let result = new Matrix(matrix.rows, matrix.cols);

		for (let i = 0; i < matrix.rows; i++) {
			for (let j = 0; j < matrix.cols; j++) {
				let val = matrix.data[i][j];
				result.data[i][j] = func(val);
			}
		}
		return result;
	}

	multiply(n) {
		if (n instanceof Matrix) {
			// hadamard product
			for (let i = 0; i < this.rows; i++) {
				for (let j = 0; j < this.cols; j++) {
					this.data[i][j] *= n.data[i][j];
				}
			}
		} else {
			// Scalar product
			for (let i = 0; i < this.rows; i++) {
				for (let j = 0; j < this.cols; j++) {
					this.data[i][j] *= n;
				}
			}
		}
	}

	map(func) {
		// Apply a function to every object in the Matrix
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.cols; j++) {
				let val = this.data[i][j];
				this.data[i][j] = func(val);
			}
		}
	}

	copy() {
		let m = new Matrix(this.rows, this.cols);
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.cols; j++) {
				m.data[i][j] = this.data[i][j];
			}
		}
		return m;
	}

	add(n) {
		if (n instanceof Matrix) {
			for (let i = 0; i < this.rows; i++) {
				for (let j = 0; j < this.cols; j++) {
					this.data[i][j] += n.data[i][j];
				}
			}
		} else {
			for (let i = 0; i < this.rows; i++) {
				for (let j = 0; j < this.cols; j++) {
					this.data[i][j] += n;
				}
			}
		}
	}

	toArray() {
		let arr = [];
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.cols; j++) {
				arr.push(this.data[i][j]);
			}
		}
		return arr;
	}

	randomize() {
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.cols; j++) {
				this.data[i][j] = Math.random() * 2 - 1;
			}
		}
	}

	print() {
		console.table(this.data);
	}
}
/*!
 * Implementation of the Shunting yard algorithm
 * look it up: http://en.wikipedia.org/wiki/Shunting-yard_algorithm
 *
 * Copyright 2013, Georg Tavonius
 *           2020, Allison Hancock <aahancoc@umich.edu>
 * Licensed under the MIT license.
 *
 * @version 3.0.0
 *
 * @author Georg Tavonius a.k.a. Calamari (http://github.com/Calamari)
 * @homepage http://github.com/Calamari/shunting-yard.js
 */
import Operator from './Operator'

export default class ShuntingYard {
	constructor (options = {}) {
		this.operators = options.operators || {
			'+': new Operator('+', 2, 'left', 2, function(a, b) { return a + b }),
			'-': new Operator('-', 2, 'left', 2, function(a, b) { return a - b }),
			'*': new Operator('*', 3, 'left', 2, function(a, b) { return a * b }),
			'/': new Operator('/', 3, 'left', 2, function(a, b) { return a / b }),
			'^': new Operator('^', 4, 'right', 2, function(a, b) { return Math.pow(a, b) })
		};
		this.functions = options.functions || {};
		this.parse_raw = options.parse_raw || false;
	}

	addFunction (key, func) {
		if (this.functions[key]) {
			console.warn(`Function ${key} already exists`)
		}
		this.functions[key] = func
	}

	addOperator (key, operator) {
		if (this.operators[key]) {
			console.warn(`Operator ${key} already exists`)
		}
		this.operators[key] = operator
	}

	parse (str) {
		let output = []
		let stack = []
		let sign
		let lastToken
		let token
		let i = 0;

		// List of tokens that are operators or functions
		const op_tokens =
			Object.keys(this.operators)
			.concat(Object.keys(this.functions));

		while (i < str.length) {
			token = str[i];
			// Find the corresponding operator
			for (let nit of op_tokens) {
				// If pre-tokenized, skip this step
				if (typeof(str) !== "string") { break; }
				// If token matches, make that the new token
				if (str.slice(i).startsWith(nit)) { token = nit; break; }
			}
			// Increment i by the token size
			i += (typeof(str) === "string") ? token.length : 1;
			// Skip if token is actually just a space
			if (token === ' ') { continue; }

			if (sign) {
				token = sign += token
				sign = null
			}

			if (this.isLeftPara(token)) {
				stack.push(token)
			} else if (this.isFunction(token)) {
				stack.push(token)
			} else if (this.isRightPara(token)) {
				let operator;
				while ((operator = stack.pop()) && !this.isLeftPara(operator)) {
					if (!this.isFunction(operator)) {
						output.push(operator)
					}
				}
				if (typeof operator === 'undefined') {
					throw SyntaxError("Too many closing parenthesis");
				}
			} else if (this.isOperator(token)) {
				if (!lastToken || lastToken === '(') {
					sign = token
					continue
				}
				while (stack.length) {
					const thisOperator = this.operators[token]
					const operator = this.operators[stack[stack.length-1]]
					if (!operator || !thisOperator) { break }
					if ((thisOperator.leftAssoc() && thisOperator.lessThenEqual(operator)) || thisOperator.lessThen(operator)) {
						output.push(stack.pop())
					} else {
						break
					}
				}
				stack.push(token)
			} else {
				if (!lastToken || this.isLeftPara(lastToken) || this.isOperator(lastToken)) {
					output.push(token)
				} else {
					output[output.length - 1] += token
				}
			}
			lastToken = token
		}

		while (stack.length) {
			token = stack.pop()
			if (this.isLeftPara(token)) {
				throw SyntaxError("Too many opening parenthesis");
			}
			output.push(token)
		}

		return output
	}

	resolveRpn (arr) {
		let stack = []

		for (let i=0, l=arr.length; i<l; ++i) {
			const op = this.operators[arr[i]] || this.functions[arr[i]]
			if (op) {
				stack.push(op.method.apply(this, stack.splice(-op.params)))
			} else {
				stack.push(this.parse_raw ? arr[i] : parseFloat(arr[i]))
			}
		}

		return stack[0]
	}

	resolve (str) {
		return this.resolveRpn(this.parse(str))
	}

	isLeftPara (token) {
		return token === '('
	}

	isRightPara (token) {
		return token === ')'
	}

	isOperator (token) {
		return Object.keys(this.operators).indexOf(token) !== -1
	}

	isFunction (token) {
		return Object.keys(this.functions).indexOf(token) !== -1
	}
}

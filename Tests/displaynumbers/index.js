const getNumbersWithMath = (num, size) => {
	const numbers = []
	const cc = Math.floor(num / (10 ** (size - 1)))
	const first = cc > 9 ? cc / 10 : cc

	numbers.push(first)

	for (let i = (size - 2); i >= 0; i--) {
		const divisor = i && (10 ** i) || 1
		const rest = (10 ** (i + 1))
		const calc = Math.floor((num % rest) / divisor)
		numbers.push(calc)
	}

	return numbers
}

const getNumbersBySpliting = num => {
	const string = BigInt(num).toString()
	return string.split('')
}

const number = 10000000000000000000000
const calc = Math.ceil(Math.log10(number+1))
const size = calc < 16 ? calc : (calc+1)

if (size > 23) {
	return console.log('Número largo demais!')
}

//getNumbersWithMath(number, size)
const numbers = getNumbersBySpliting(number)

console.log(`size: ${size}`)
console.log(numbers)

// Limite 15

// Rest
// (98765 / 10000) = 9
// (98765 % 10000 / 1000) = 8
// (98765 % 1000 / 100) = 7
// (98765 % 100 / 10) = 6
// (98765 % 10) = 5

/// Divisor
//1000 * 10 = 10000
//100 * 10 = 1000
//10 * 10 = 100
//10 = 10

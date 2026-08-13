// Package calculator implements pure arithmetic operations, independent of transport.
package calculator

import (
	"errors"
	"math"
)

var (
	ErrDivideByZero = errors.New("division by zero")
	ErrNegativeSqrt = errors.New("cannot take square root of a negative number")
)

func Add(a, b float64) float64 {
	return a + b
}

func Subtract(a, b float64) float64 {
	return a - b
}

func Multiply(a, b float64) float64 {
	return a * b
}

func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivideByZero
	}
	return a / b, nil
}

func Power(base, exponent float64) float64 {
	return math.Pow(base, exponent)
}

func Sqrt(a float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrt
	}
	return math.Sqrt(a), nil
}

// Percentage returns a percent of b (a% of b).
func Percentage(a, b float64) float64 {
	return (a / 100) * b
}

package calculator

import (
	"errors"
	"math"
	"testing"
)

func TestAdd(t *testing.T) {
	cases := []struct{ a, b, want float64 }{
		{2, 3, 5},
		{-2, 3, 1},
		{0, 0, 0},
		{2.5, 2.5, 5},
	}
	for _, c := range cases {
		if got := Add(c.a, c.b); got != c.want {
			t.Errorf("Add(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
		}
	}
}

func TestSubtract(t *testing.T) {
	cases := []struct{ a, b, want float64 }{
		{5, 3, 2},
		{3, 5, -2},
		{0, 0, 0},
	}
	for _, c := range cases {
		if got := Subtract(c.a, c.b); got != c.want {
			t.Errorf("Subtract(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
		}
	}
}

func TestMultiply(t *testing.T) {
	cases := []struct{ a, b, want float64 }{
		{2, 3, 6},
		{-2, 3, -6},
		{0, 5, 0},
	}
	for _, c := range cases {
		if got := Multiply(c.a, c.b); got != c.want {
			t.Errorf("Multiply(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
		}
	}
}

func TestDivide(t *testing.T) {
	got, err := Divide(6, 3)
	if err != nil || got != 2 {
		t.Errorf("Divide(6, 3) = %v, %v; want 2, nil", got, err)
	}

	_, err = Divide(1, 0)
	if !errors.Is(err, ErrDivideByZero) {
		t.Errorf("Divide(1, 0) error = %v, want ErrDivideByZero", err)
	}
}

func TestPower(t *testing.T) {
	cases := []struct{ base, exp, want float64 }{
		{2, 3, 8},
		{5, 0, 1},
		{2, -1, 0.5},
	}
	for _, c := range cases {
		if got := Power(c.base, c.exp); got != c.want {
			t.Errorf("Power(%v, %v) = %v, want %v", c.base, c.exp, got, c.want)
		}
	}
}

func TestSqrt(t *testing.T) {
	got, err := Sqrt(9)
	if err != nil || got != 3 {
		t.Errorf("Sqrt(9) = %v, %v; want 3, nil", got, err)
	}

	_, err = Sqrt(-1)
	if !errors.Is(err, ErrNegativeSqrt) {
		t.Errorf("Sqrt(-1) error = %v, want ErrNegativeSqrt", err)
	}
}

func TestPercentage(t *testing.T) {
	cases := []struct{ a, b, want float64 }{
		{50, 200, 100},
		{10, 50, 5},
		{0, 100, 0},
	}
	for _, c := range cases {
		if got := Percentage(c.a, c.b); math.Abs(got-c.want) > 1e-9 {
			t.Errorf("Percentage(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
		}
	}
}

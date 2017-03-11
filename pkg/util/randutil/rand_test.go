package randutil

import (
	"testing"
)

func TestPseudoRand(t *testing.T) {
	numbers := make(map[int]bool)
	// Create two random number generators and draw two numbers from each
	rand1, _ := NewPseudoRand()
	rand2, _ := NewPseudoRand()
	numbers[rand1.Int()] = true
	numbers[rand1.Int()] = true
	numbers[rand2.Int()] = true
	numbers[rand2.Int()] = true
	// All four numbers should be distinct; no seed state is shared
	if len(numbers) != 4 {
		t.Errorf("expected 4 unique numbers; got %d", len(numbers))
	}
}

func TestRandIntInRange(t *testing.T) {
	rand, _ := NewPseudoRand()
	for i := 0; i < 500; i++ {
		x := RandIntInRange(rand, 20, 40)
		if x < 20 || x >= 40 {
			t.Errorf("got result out of range: %d", x)
		}
	}
}

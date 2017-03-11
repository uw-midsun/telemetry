package randutil

import (
	crypto_rand "crypto/rand"
	"encoding/binary"
	"fmt"
	"math/rand"
)

// NewPseudoSeed generates a seed from crypto/rand.
func NewPseudoSeed() int64 {
	var seed int64
	err := binary.Read(crypto_rand.Reader, binary.LittleEndian, &seed)
	if err != nil {
		panic(fmt.Sprintf("could not read from crypto/rand: %s", err))
	}
	return seed
}

// NewPseudoRand returns an instance of math/rand.Rand seeded from crypto/rand
// and its seed to easily generate unique streams of numbers
func NewPseudoRand() (*rand.Rand, int64) {
	seed := NewPseudoSeed()
	return rand.New(rand.NewSource(seed)), seed
}

// RandIntInRange returns a value in [min, max)
func RandIntInRange(r *rand.Rand, min, max int) int {
	return min + r.Intn(max-min)
}

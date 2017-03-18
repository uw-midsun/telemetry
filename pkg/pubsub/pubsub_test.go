package pubsub

import (
	"sync/atomic"
	"testing"
)

func TestNew(t *testing.T) {
	messageBus := New()

	if messageBus == nil {
		t.Errorf("Could not create MessageBus")
		t.Fail()
	}
}

func TestSubscribe(t *testing.T) {
	messageBus := New()

	// should successfully create a new Subscriber on the Message Bus
	if messageBus.Subscribe("topic", func() {}) != nil {
		t.Fail()
	}

	if messageBus.Subscribe("topic", func() {}) != nil {
		t.Fail()
	}
}

func TestSubscribeNonFunction(t *testing.T) {
	messageBus := New()

	// should fail since "String" is not a callback
	if messageBus.Subscribe("topic", "String") == nil {
		t.Fail()
	}
}

func TestSubscribeMultiple(t *testing.T) {
	messageBus := New()

	callbackOne := false
	callbackTwo := false

	messageBus.Subscribe("topic", func() {
		callbackOne = true
	})

	messageBus.Subscribe("topic", func() {
		callbackTwo = true
	})

	messageBus.Publish("topic")

	messageBus.Wait()

	if callbackOne == false {
		t.Fail()
	}
	if callbackTwo == false {
		t.Fail()
	}
}

func TestPublish(t *testing.T) {
	messageBus := New()

	messageBus.Subscribe("topic", func(a int, b int) {
		if a != b {
			t.Fail()
		}
	})
	messageBus.Publish("topic", 10, 10)

	messageBus.Wait()
}

func TestPublishIgnore(t *testing.T) {
	messageBus := New()

	// the callback should not run since it is not subscribed
	messageBus.Subscribe("topic", func(a string) {
		t.Fail()
	})

	messageBus.Publish("solar", "car")
}

func TestPublishNoSubscriber(t *testing.T) {
	messageBus := New()

	messageBus.Publish("topic", 10, 10)
}

func TestPublishWaitOrder(t *testing.T) {
	messageBus := New()
	ops := uint64(0)
	sum := uint64(0)

	messageBus.Subscribe("sums", func(a uint64) {
		atomic.AddUint64(&ops, a)
	})

	for i := uint64(1); i <= 100000; i++ {
		messageBus.Publish("sums", i)

		messageBus.Wait()
		sum = sum + i
		if ops != sum {
			t.Errorf("Expected %d but got %d\n", sum, ops)
			t.Fail()
		}
	}
}

func TestPublishWait(t *testing.T) {
	messageBus := New()
	ops := uint64(0)
	calls := uint64(100000)

	messageBus.Subscribe("sums", func(a uint64) {
		atomic.AddUint64(&ops, 1)
	})

	for i := uint64(1); i <= calls; i++ {
		messageBus.Publish("sums", i)
	}

	messageBus.Wait()

	if ops != calls {
		t.Errorf("Expected %d but got %d\n", calls, ops)
		t.Fail()
	}
}

func TestUnsubscribe(t *testing.T) {
	messageBus := New()

	handler := func(a int) {
		if a != 1 {
			t.Errorf("Expected %d but got %d\n", 1, a)
			t.Fail()
		}
	}

	messageBus.Subscribe("test", handler)
	messageBus.Publish("test", 1)

	messageBus.Wait()
	messageBus.Unsubscribe("test", handler)
}

func TestUnsubscribeFail(t *testing.T) {
	messageBus := New()
	handler := func() {}

	messageBus.Subscribe("topic", handler)
	if messageBus.Unsubscribe("topic", handler) != nil {
		t.Fail()
	}
	if messageBus.Unsubscribe("topic", handler) == nil {
		t.Fail()
	}
}

func TestUnsubscribeFailTopic(t *testing.T) {
	messageBus := New()
	handler := func() {}

	messageBus.Subscribe("topic", handler)

	if messageBus.Unsubscribe("missing", "yolo swaggins") == nil {
		t.Fail()
	}
}

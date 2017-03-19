package pubsub

import (
	"fmt"
	"reflect"
	"sync"
)

// MessageBus is a message bus
type MessageBus struct {
	handlers map[string][]*messageHandler
	lock     sync.Mutex
	wg       sync.WaitGroup
}

type messageHandler struct {
	callBack reflect.Value
}

// New creates a new MessageBus with no message handlers
func New() *MessageBus {
	return &MessageBus{
		make(map[string][]*messageHandler),
		sync.Mutex{},
		sync.WaitGroup{},
	}
}

func (bus *MessageBus) subscribe(topic string, fn interface{}, handler *messageHandler) error {
	bus.lock.Lock()
	defer bus.lock.Unlock()

	if reflect.TypeOf(fn).Kind() != reflect.Func {
		return fmt.Errorf("%s is not a reflect.Func", reflect.TypeOf(fn))
	}

	bus.handlers[topic] = append(bus.handlers[topic], handler)
	return nil
}

func (bus *MessageBus) publish(topic string, handler *messageHandler, args ...interface{}) {
	defer bus.wg.Done()

	passedArguments := make([]reflect.Value, 0)
	for _, arg := range args {
		passedArguments = append(passedArguments, reflect.ValueOf(arg))
	}

	handler.callBack.Call(passedArguments)
}

// Publish publishes messages on a topic
func (bus *MessageBus) Publish(topic string, args ...interface{}) {
	bus.lock.Lock()
	defer bus.lock.Unlock()

	if handlers, ok := bus.handlers[topic]; ok {
		for _, handler := range handlers {
			bus.wg.Add(1)
			go bus.publish(topic, handler, args...)
		}
	}
}

// Subscribe subscribes to a topic
func (bus *MessageBus) Subscribe(topic string, fn interface{}) error {
	return bus.subscribe(topic, fn, &messageHandler{
		reflect.ValueOf(fn),
	})
}

func (bus *MessageBus) removeHandler(topic string, callback reflect.Value) {
	if _, ok := bus.handlers[topic]; ok {
		for i, handler := range bus.handlers[topic] {
			if handler.callBack == callback {
				bus.handlers[topic] = append(bus.handlers[topic][:i], bus.handlers[topic][i+1:]...)
			}
		}
	}
}

// Unsubscribe removes the associated handler from a topic
// If there are no callbacks on the topic, an error is returned
func (bus *MessageBus) Unsubscribe(topic string, handler interface{}) error {
	bus.lock.Lock()
	defer bus.lock.Unlock()

	if _, ok := bus.handlers[topic]; ok && len(bus.handlers[topic]) > 0 {
		bus.removeHandler(topic, reflect.ValueOf(handler))
		return nil
	}
	return fmt.Errorf("topic %s doesn't exist", topic)
}

// Wait blocks until all async callbacks are run
func (bus *MessageBus) Wait() {
	bus.wg.Wait()
}

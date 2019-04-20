package msgs

import (
	"encoding/json"
	"io/ioutil"
	"sort"
	"strconv"
	"time"

	log "github.com/golang/glog"
	"github.com/golang/protobuf/proto"

	canpb "github.com/uw-midsun/telemetry/pkg/protos"
)

// CAN describes a single message from the CAN bus. This assumes network layer CAN! ID is the
// message ID for the network.
type CAN struct {
	Source    uint8                  `json:"source"`
	ID        uint16                 `json:"id"`
	DLC       uint8                  `json:"dlc"`
	RTR       bool                   `json:"rtr"`
	Timestamp uint64                 `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

// ToSlice converts a CAN object to a list of string with the Data field as a JSON object.
func (c CAN) ToSlice() []string {
	mapBytes, _ := json.Marshal(c.Data)
	return []string{
		strconv.FormatUint(uint64(c.Source), 10),
		strconv.FormatUint(uint64(c.ID), 10),
		strconv.FormatBool(c.RTR),
		strconv.FormatUint(c.Timestamp, 10),
		string(mapBytes),
	}
}

var schema canpb.CanSchema

// CanMsgInit Initializes the CAN msg parser with the provided schema.
func CanMsgInit(filename string) error {
	b, err := ioutil.ReadFile(filename)
	if err != nil {
		log.Fatalln("Failed to read can_schema.asciipb")
		return err
	}
	err = proto.UnmarshalText(string(b), &schema)
	if err != nil {
		log.Fatalln("Failed to unmarshal:", err.Error())
		return err
	}
	return nil
}

// NewCAN creates a CAN struct, this should be used for all incoming messages.
func NewCAN(rawID uint32, rawData uint64, dlc uint8) CAN {
	var canMsg CAN
	canMsg.DLC = dlc
	canMsg.Data = make(map[string]interface{})
	parse(rawID, rawData, &canMsg)
	return canMsg
}

// NewFakeCAN creates a CAN struct with an ID already specified.
func NewFakeCAN(source uint8, ID uint16, rawData uint64, dlc uint8) CAN {
	var canMsg CAN
	canMsg.DLC = dlc
	canMsg.Data = make(map[string]interface{})
	canMsg.Timestamp = uint64(time.Now().UnixNano()) / uint64(time.Millisecond)
	canMsg.Source = source
	canMsg.RTR = false
	canMsg.ID = ID
	srcMsg := findCanMessage(uint32(canMsg.ID))
	if srcMsg == nil {
		log.Errorf("Error: no matching schema for", canMsg.ID)
		canMsg.Data["raw"] = rawData
	} else {
		unpackByType(rawData, srcMsg, &canMsg)
	}
	return canMsg
}

func parse(rawID uint32, rawData uint64, canMsg *CAN) {
	canMsg.Timestamp = uint64(time.Now().UnixNano()) / uint64(time.Millisecond)
	canMsg.Source = uint8(rawID & 0xF)
	canMsg.RTR = ((rawID & 0x10) >> 4) == 1
	canMsg.ID = uint16((rawID & 0x7E0) >> 5)
	srcMsg := findCanMessage(uint32(canMsg.ID))
	if srcMsg == nil {
		log.Errorf("Error: no matching schema for", canMsg.ID)
		canMsg.Data["raw"] = rawData
		return
	}
	unpackByType(rawData, srcMsg, canMsg)
}

func unpackByType(rawData uint64, srcMsg *canpb.CanMsg, canMsg *CAN) {
	switch srcMsg.GetCanData().GetFrame().(type) {
	case *canpb.CanData_U8:
		data := srcMsg.GetCanData().GetU8()
		name := data.GetFieldName_1()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFF, 1, 8)
		}
		name = data.GetFieldName_2()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFF, 2, 8)
		}
		name = data.GetFieldName_3()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFF, 3, 8)
		}
		name = data.GetFieldName_4()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFF, 4, 8)
		}
		name = data.GetFieldName_5()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFF, 5, 8)
		}
		name = data.GetFieldName_6()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFF, 6, 8)
		}
		name = data.GetFieldName_7()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFF, 7, 8)
		}
		name = data.GetFieldName_8()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFF, 8, 8)
		}
		break
	case *canpb.CanData_U16:
		data := srcMsg.GetCanData().GetU16()
		name := data.GetFieldName_1()
		if name != "" {
			value := extractData(rawData, 0xFFFF, 1, 16)
			canMsg.Data[name] = value
		}
		name = data.GetFieldName_2()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFFFF, 2, 16)
		}
		name = data.GetFieldName_3()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFFFF, 3, 16)
		}
		name = data.GetFieldName_4()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFFFF, 4, 16)
		}
		break
	case *canpb.CanData_U32:
		data := srcMsg.GetCanData().GetU32()
		name := data.GetFieldName_1()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFFFFFFFF, 1, 32)
		}
		name = data.GetFieldName_2()
		if name != "" {
			canMsg.Data[name] = extractData(rawData, 0xFFFFFFFF, 2, 32)
		}
		break
	case *canpb.CanData_U64:
		data := srcMsg.GetCanData().GetU64()
		canMsg.Data[data.GetFieldName_1()] = rawData
	}
}

func extractData(data uint64, mask uint64, field uint8, size uint8) uint64 {
	shift := (field - 1) * size
	return (data & (mask << shift)) >> shift
}

func findCanMessage(ID uint32) *canpb.CanMsg {
	msgs := schema.GetMsg()
	i := sort.Search(len(msgs), func(i int) bool {
		return msgs[i].GetId() >= ID
	})
	if i < len(msgs) {
		return msgs[i]
	}
	return nil
}

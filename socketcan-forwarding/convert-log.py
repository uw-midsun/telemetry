import sys
import time

if __name__ == '__main__':
  in_filename = sys.argv[1]
  out_filename = sys.argv[2]

  out_file = open(out_filename, 'w+') 
  with open(in_filename, 'r') as f:
    for line in f:
      split = line.split(",")
      timestamp_seconds = split[0][1:];
      timestamp_milliseconds = split[1][:-1]
      arbitration_id = split[2][2:]
      data = split[3][2:]
      size = split[4]

      if "0" in size:
        continue

      pattern = '%Y-%m-%d %H:%M:%S'
      timestamp = int(time.mktime(time.strptime(timestamp_seconds, pattern)))
      timestamp = str(timestamp) + "." + timestamp_milliseconds + "000"

      arbitration_id = arbitration_id.zfill(3)

      string = "({}) {} {}#{}\n".format(timestamp, "vcan0", arbitration_id, data)                                # Slice off file extension and replace with txt
      out_file.write(string)

    out_file.close()
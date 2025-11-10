#!/bin/bash

# Check if count argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <count>"
    echo "Example: $0 5"
    exit 1
fi

COUNT=$1

# Validate count is a positive integer
if ! [[ "$COUNT" =~ ^[0-9]+$ ]] || [ "$COUNT" -le 0 ]; then
    echo "Error: Count must be a positive integer"
    exit 1
fi

echo "Executing $COUNT parallel curl requests..."
echo "=========================================="
echo ""

# Create temporary directory for results
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Function to execute a single request
execute_request() {
    local index=$1
    local output_file="$TEMP_DIR/request_$index.json"
    local time_file="$TEMP_DIR/time_$index.txt"

    START_TIME=$(date +%s.%N)

    curl 'http://localhost:8090/execute' \
      -H 'sec-ch-ua-platform: "macOS"' \
      -H 'Referer: http://localhost:8090/' \
      -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
      -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
      -H 'Content-Type: application/json' \
      -H 'sec-ch-ua-mobile: ?0' \
      --data-raw $'{"code":"from django.db import models\\nimport time\\n\\nclass Person(models.Model):\\n    name = models.CharField(max_length=100)\\n\\n    def __str__(self):\\n        return self.name\\n\\ndef run():\\n    instance = Person.objects.create(name=\'John Doe\')\\n    time.sleep(5)\\n    print(f\'Created: {instance}\')\\n","ignore_cache":true,"database":"sqlite"}' \
      -s -o "$output_file"

    END_TIME=$(date +%s.%N)
    ELAPSED=$(echo "$END_TIME - $START_TIME" | bc)
    echo "$ELAPSED" > "$time_file"

    echo "Request #$index completed in ${ELAPSED}s"
}

# Export function so it's available to subshells
export -f execute_request
export TEMP_DIR

# Launch all requests in parallel
START_TOTAL=$(date +%s.%N)

for i in $(seq 1 $COUNT); do
    execute_request $i &
done

# Wait for all background jobs to complete
wait

END_TOTAL=$(date +%s.%N)
TOTAL_ELAPSED=$(echo "$END_TOTAL - $START_TOTAL" | bc)

echo ""
echo "=========================================="
echo "All requests completed in ${TOTAL_ELAPSED}s"
echo "=========================================="
echo ""

# Display results
for i in $(seq 1 $COUNT); do
    output_file="$TEMP_DIR/request_$i.json"
    time_file="$TEMP_DIR/time_$i.txt"

    if [ -f "$output_file" ]; then
        echo "Request #$i ($(cat $time_file)s):"
        echo "---"
        cat "$output_file" | jq '.'
        echo ""
        echo "=========================================="
        echo ""
    fi
done

# Summary
echo "Summary:"
echo "- Total requests: $COUNT"
echo "- Total time: ${TOTAL_ELAPSED}s"
echo ""

# Count successful vs error responses
SUCCESS_COUNT=$(grep -l '"event":"job-done"' $TEMP_DIR/request_*.json 2>/dev/null | wc -l)
ERROR_COUNT=$(grep -l '"event":"job-' $TEMP_DIR/request_*.json 2>/dev/null | grep -v 'job-done' | wc -l)

echo "- Successful: $SUCCESS_COUNT"
echo "- Errors: $ERROR_COUNT"

if [ $ERROR_COUNT -gt 0 ]; then
    echo ""
    echo "Error types:"
    grep -h '"event":' $TEMP_DIR/request_*.json | grep -v 'job-done' | sort | uniq -c
fi

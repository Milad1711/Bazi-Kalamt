#!/usr/bin/env bash
# Runtime smoke test for the secure admin password box (کادر امن)
set -e
cd /home/z/my-project
PORT=3111 npx next start -p 3111 > /tmp/admin-test-server.log 2>&1 &
SRV_PID=$!
trap 'kill $SRV_PID 2>/dev/null' EXIT

# wait for the server
for i in $(seq 1 30); do
  if curl -s -o /dev/null --max-time 1 http://localhost:3111/api/admin/password; then break; fi
  sleep 1
done

B=http://localhost:3111
echo "== 1) public GET (no secret) =="
curl -s $B/api/admin/password; echo

echo "== 2) demo token still works (no custom password yet) =="
curl -s -H "x-admin-token: bq3-admin-demo" $B/api/admin/stats | head -c 120; echo

echo "== 3) wrong token rejected =="
curl -s -o /dev/null -w "status=%{http_code}\n" -H "x-admin-token: nope" $B/api/admin/stats

echo "== 4) weak new password rejected =="
curl -s -w " status=%{http_code}\n" -X POST -H "x-admin-token: bq3-admin-demo" -H "Content-Type: application/json" \
  -d '{"currentToken":"bq3-admin-demo","newToken":"short"}' $B/api/admin/password

echo "== 5) set a real password =="
curl -s -w " status=%{http_code}\n" -X POST -H "x-admin-token: bq3-admin-demo" -H "Content-Type: application/json" \
  -d '{"currentToken":"bq3-admin-demo","newToken":"Ramze-Man-1403!"}' $B/api/admin/password

echo "== 6) old demo token now DEAD =="
curl -s -o /dev/null -w "status=%{http_code}\n" -H "x-admin-token: bq3-admin-demo" $B/api/admin/stats

echo "== 7) new password works + hasCustom=true =="
curl -s -H "x-admin-token: Ramze-Man-1403!" $B/api/admin/password; echo

echo "== 8) mismatched currentToken rejected (defence in depth) =="
curl -s -w " status=%{http_code}\n" -X POST -H "x-admin-token: Ramze-Man-1403!" -H "Content-Type: application/json" \
  -d '{"currentToken":"bq3-admin-demo","newToken":"Another-Pass-9"}' $B/api/admin/password

echo "== 9) admin page HTML renders =="
curl -s $B/admin | rg -o "کادر امن" | head -1

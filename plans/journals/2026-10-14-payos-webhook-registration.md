# PayOS webhook registration repair

The documented signed sample transaction was rejected as a missing order (404).
Regression tests reproduced it before the fix. The handler now acknowledges
authenticated unknown orders with ignored=true, logs a reconciliation warning,
and never writes payment or subscription data on that path. Invalid signatures
and mismatched amounts still return 400 with distinct error codes.

Payment tests: 12/12. Frontend: 232/232. Backend full run: 486/487; an unrelated
recording-finalize concurrency case returned one 404, then its isolated suite
passed 23/23. Typecheck/build/diff-check passed. Audio code is untouched.

The portal's generic 400 has not been traced to a real production payload.
No live credentials were read or sent, no real payment was made, and no deployment
was performed. Operator deployment and actual PayOS confirmation remain required.
Unknown signed payment orders now require manual log reconciliation.

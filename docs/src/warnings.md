Warnings module solves the problem of various asynchronous notification about various events that Icebear needs to do.

There are 2 kinds of system warnings at the moment.
1. Server warnings.
Server sends a translation key from a restricted amount of allowed keys (`serverWarning_` prefix) and a unique id for
the warning. Icebear generates a system warning and, after it's dismissed,
informs server that user has acknowledged this warning.
2. System warnings.
Any Icebear subsystem or your application code can generate a warning with any available translation key
and optionally some data for that key.
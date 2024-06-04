args=("$@")
curl -X POST http://localhost/auth \
-c memory -d 'username='${args[0]}'&password='${args[1]} \
-H "Content-Type: application/x-www-form-urlencoded" \
--next -X GET -c memory http://localhost/status \
--next -X GET -c memory http://localhost/whoami \
&& rm memory

# Uptime monitoring (UptimeRobot)

Your Terms of Service state that you *target* 99% monthly uptime. To back that up, you should measure it.

## Health endpoint

The API exposes a health check:

- **URL:** `GET https://<your-api-host>/health`
- **Response:** `200` with `{ "status": "ok", "timestamp": "<ISO date>" }`

## UptimeRobot setup

1. Sign up at [uptimerobot.com](https://uptimerobot.com).
2. Add a new monitor:
   - **Monitor Type:** HTTP(s)
   - **URL:** `https://<your-api-host>/health`
   - **Monitoring Interval:** 5 minutes (or 1 minute on paid plan)
3. Set up alert contacts (email/SMS) so you're notified when the service is down.

Without monitoring, you cannot know if you're meeting your target uptime, and you cannot respond quickly to outages.

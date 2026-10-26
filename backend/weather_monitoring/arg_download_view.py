# ---------------------------------------------------------------
# Protected CSV download for the ARG page.
# Add this to your Django app's views.py (the same app that has
# the arg-realtime view), then add the URL shown at the bottom.
# ---------------------------------------------------------------
import csv
import hmac
import io
import json
import os

from django.core.cache import cache
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

MAX_ATTEMPTS = 5          # wrong keys allowed per IP...
LOCKOUT_SECONDS = 15 * 60 # ...in this many seconds


def _client_ip(request):
    fwd = request.META.get('HTTP_X_FORWARDED_FOR')
    return fwd.split(',')[0].strip() if fwd else request.META.get('REMOTE_ADDR', 'unknown')


@csrf_exempt
@require_POST
def arg_download(request):
    expected_key = os.environ.get('ARG_DOWNLOAD_KEY', '')
    if not expected_key:
        return JsonResponse({'error': 'Downloads are not configured on the server.'}, status=503)

    ip = _client_ip(request)
    attempts_key = f'arg_dl_attempts:{ip}'
    attempts = cache.get(attempts_key, 0)
    if attempts >= MAX_ATTEMPTS:
        return JsonResponse({'error': 'Too many wrong attempts. Try again in 15 minutes.'}, status=429)

    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid request.'}, status=400)

    key = str(body.get('key', ''))
    if not hmac.compare_digest(key.encode(), expected_key.encode()):
        cache.set(attempts_key, attempts + 1, LOCKOUT_SECONDS)
        return JsonResponse({'error': 'Incorrect download key.'}, status=401)

    cache.delete(attempts_key)

    station = str(body.get('station', 'ARGS1'))
    try:
        hours = max(1, min(int(body.get('hours', 6)), 24 * 31))
    except (TypeError, ValueError):
        hours = 6

    # >>> Reuse the SAME query your arg-realtime view uses. <<<
    # It must return a list of dicts with: id, timestamp, rainfall, temperature, humidity
    rows = get_arg_rows(station, hours)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(['ID', 'Timestamp', 'RFD(mm)', 'T(c)', 'RH(%)'])
    for r in rows:
        writer.writerow([
            r.get('id', ''), r.get('timestamp', ''),
            r.get('rainfall', ''), r.get('temperature', ''), r.get('humidity', ''),
        ])

    response = HttpResponse(buf.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{station}_{hours}h.csv"'
    response['Cache-Control'] = 'no-store'
    return response


# urls.py  (same file where 'weather/arg-realtime' is registered):
#
#   path('weather/arg-download/', views.arg_download, name='arg_download'),
#
# so the full URL is  /api/weather/arg-download/
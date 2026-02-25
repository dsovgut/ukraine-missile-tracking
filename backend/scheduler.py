import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)
_scheduler = BackgroundScheduler()


def start_scheduler():
    from .data_sync import sync_data

    _scheduler.add_job(sync_data, CronTrigger(hour=6, minute=0), id="daily_sync", replace_existing=True)
    _scheduler.start()
    logger.info("Scheduler started — daily sync at 06:00 UTC")


def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)

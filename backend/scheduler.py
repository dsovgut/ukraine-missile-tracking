import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)
_scheduler = BackgroundScheduler()


def _sync_and_retrain():
    from .data_sync import sync_data
    from .prediction import train_model

    sync_data()
    train_model()


def start_scheduler():
    _scheduler.add_job(_sync_and_retrain, CronTrigger(hour=6, minute=0), id="daily_sync", replace_existing=True)
    _scheduler.start()
    logger.info("Scheduler started — daily sync + model retrain at 06:00 UTC")


def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)

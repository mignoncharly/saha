from celery import shared_task

from .retention import run_data_retention


@shared_task
def run_data_retention_task():
    return run_data_retention(apply=True)

from django.db import models


class ProductBacklogItem(models.Model):
    title = models.CharField(max_length=512)
    description = models.TextField()
    order = models.IntegerField()
    size = models.IntegerField()

    def __str__(self):
        return self.title
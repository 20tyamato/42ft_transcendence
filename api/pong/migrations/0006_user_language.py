# Generated by Django 5.1.6 on 2025-02-12 05:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0005_gamesession'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='language',
            field=models.CharField(default='en', max_length=10),
        ),
    ]

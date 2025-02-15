# Generated by Django 5.1.6 on 2025-02-15 13:06

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0006_user_language'),
    ]

    operations = [
        migrations.CreateModel(
            name='TournamentGameSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('status', models.CharField(choices=[('WAITING_PLAYERS', 'Waiting for Players'), ('READY', 'Ready to Start'), ('IN_PROGRESS', 'Tournament in Progress'), ('COMPLETED', 'Tournament Completed'), ('CANCELLED', 'Tournament Cancelled')], default='WAITING_PLAYERS', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('min_players', models.IntegerField(default=2)),
                ('max_players', models.IntegerField(default=8)),
                ('current_round', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='TournamentMatch',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round_number', models.IntegerField()),
                ('match_number', models.IntegerField()),
                ('game', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='pong.game')),
                ('next_match', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='pong.tournamentmatch')),
                ('player1', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tournament_matches_as_player1', to=settings.AUTH_USER_MODEL)),
                ('player2', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tournament_matches_as_player2', to=settings.AUTH_USER_MODEL)),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='pong.tournamentgamesession')),
            ],
            options={
                'unique_together': {('tournament', 'round_number', 'match_number')},
            },
        ),
        migrations.CreateModel(
            name='TournamentParticipant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('seed', models.IntegerField(blank=True, null=True)),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participants', to='pong.tournamentgamesession')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tournament_participations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('tournament', 'user')},
            },
        ),
    ]

// frontend/src/pages/Tournament/Ready/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { tournamentRepository } from '@/models/Tournament/repository';
import './style.css';

const ReadyPage = new Page({
    name: 'Tournament/Ready',
    config: {
        layout: CommonLayout,
        html: '/src/pages/Tournament/Ready/index.html',
    },
    mounted: async () => {
        let isReady = false;
        const timerElement = document.getElementById('timer');
        const readyButton = document.getElementById('ready-button');

        try {
            await tournamentRepository.connect(handleWebSocketMessage);
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            window.location.href = '/tournament';
            return;
        }

        function handleWebSocketMessage(data: any) {
            switch (data.type) {
                case 'timer_update':
                    if (timerElement) {
                        timerElement.textContent = data.remaining.toString();
                    }
                    break;
                case 'all_ready':
                    window.location.href = '/tournament/game';
                    break;
                case 'ready_failed':
                    window.location.href = '/tournament';
                    break;
            }
        }

        if (readyButton) {
            readyButton.addEventListener('click', () => {
                isReady = !isReady;
                readyButton.textContent = isReady ? 'Cancel Ready' : 'Ready';
                readyButton.classList.toggle('ready', isReady);
                
                tournamentRepository.sendReady(isReady);
            });
        }

        return () => {
            tournamentRepository.disconnect();
        };
    }
});

export default ReadyPage;
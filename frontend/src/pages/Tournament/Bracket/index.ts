// frontend/src/pages/Tournament/Bracket/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { BracketDisplay } from './BracketDisplay';
import './style.css';

const BracketPage = new Page({
  name: 'Tournament/Bracket',
  config: {
    layout: CommonLayout,
    html: '/src/pages/Tournament/Bracket/index.html', // HTMLファイルのパスを追加
  },
  mounted: () => {
    const bracketDisplay = new BracketDisplay('bracket-container');

    // サンプルデータ
    const sampleData = {
      matches: [
        {
          id: 'semi1',
          round: 0,
          player1: 'Player 1',
          player2: 'Player 2',
          status: 'completed',
          winner: 'Player 1',
        },
        {
          id: 'semi2',
          round: 0,
          player1: 'Player 3',
          player2: 'Player 4',
          status: 'completed',
          winner: 'Player 4',
        },
        {
          id: 'final',
          round: 1,
          player1: 'Player 1',
          player2: 'Player 4',
          status: 'completed',
          winner: 'Player 4',
        },
      ],
    };
    bracketDisplay.update(sampleData);
  },
});

export default BracketPage;

import {Composition} from 'remotion';
import {Main} from './Main';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={Math.round(85.68 * 30)} // 85.68 seconds at 30fps (Edge TTS)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

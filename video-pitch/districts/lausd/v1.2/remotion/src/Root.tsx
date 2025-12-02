import {Composition} from 'remotion';
import {Main} from './Main';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={Math.round(97.82 * 30)} // 97.82 seconds at 30fps (v1.2.5 - NO speedup, like v1.0)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

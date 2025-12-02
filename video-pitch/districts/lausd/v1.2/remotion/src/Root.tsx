import {Composition} from 'remotion';
import {Main} from './Main';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={Math.round(73.95 * 30)} // 73.95 seconds at 30fps (v1.2 - 1.2X speedup)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

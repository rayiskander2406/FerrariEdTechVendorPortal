import {Composition} from 'remotion';
import {Main} from './Main';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={Math.round(106.37 * 30)} // 106.37 seconds at 30fps (v1.2.21)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

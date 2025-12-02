import {Composition} from 'remotion';
import {Main} from './Main';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={Math.round(122.544 * 30)} // 122.544 seconds at 30fps (v1.1 - Data Sovereignty)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

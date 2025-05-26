'use client';

import {
  gql,
  useSuspenseQuery,
  useMutation,
  TypedDocumentNode,
} from '@apollo/client';
import {useRouter} from 'next/navigation';
import {useState} from 'react';

import {CreateDreamForm} from '@/components/CreateDreamForm';
import {CreateImageForm} from '@/components/CreateImageForm';

const MUTATION = gql`
  mutation SaveDream($input: DreamInput!) {
    saveDream(input: $input) {
      id
    }
  }
`;

const UPDATE = gql`
  mutation UpdateDream($id: String!, $input: DreamInput!) {
    updateDream(id: $id, input: $input) {
      id
    }
  }
`;

export function DreamFlow({dream, project}) {
  const router = useRouter();
  const [stepState, setStepState] = useState(dream?.dreamImage ? 2 : 0);
  const [memory, setMemory] = useState(dream?.memory || project.defaultMemory);
  const [story, setStory] = useState(dream?.story || project.defaultStory);
  const [dreamImage, setDreamImage] = useState(
    dream?.dreamImage || project.defaultDream,
  );
  const [prompt, setPrompt] = useState(dream?.prompt || '');
  const [saveDream, {loading: saveLoading}] = useMutation(MUTATION, {
    onCompleted: () => {
      router.push('/');
    },
  });
  const [updateDream, {loading: updateLoading}] = useMutation(UPDATE, {
    onCompleted: () => {
      router.push('/');
    },
  });

  const onStorySave = (savedMemory, savedStory) => {
    setMemory(savedMemory);
    setStory(savedStory);
    setStepState(1);
  };
  const onImageSave = (savedDreamImage, savedPrompt) => {
    setDreamImage(savedDreamImage);
    setPrompt(savedPrompt);
    setStepState(2);
  };

  const onSaveDream = data => {
    if (dream?.id) {
      updateDream({
        variables: {
          id: dream.id,
          input: {
            memory,
            story,
            dreamImage,
            prompt,
          },
        },
      });
      return;
    }

    saveDream({
      variables: {
        input: {
          memory,
          story,
          dreamImage,
          prompt,
        },
      },
    });
  };
  const loading = saveLoading || updateLoading;

  return (
    <div className="w-full flex flex-col gap-4 py-4 px-4">
      <ul className="steps">
        <li
          onClick={() => setStepState(0)}
          className={`step ${stepState >= 1 ? 'step-primary' : ''}`}>
          Create the Story
        </li>
        <li
          onClick={() => setStepState(1)}
          className={`step ${stepState >= 2 ? 'step-primary' : ''}`}>
          Draw the Story
        </li>
        <li
          onClick={() => setStepState(2)}
          className={`step ${stepState >= 3 ? 'step-primary' : ''}`}>
          Save
        </li>
      </ul>

      {stepState === 0 && (
        <CreateDreamForm onSave={onStorySave} memory={memory} />
      )}
      {stepState === 1 && (
        <CreateImageForm onSave={onImageSave} story={story} />
      )}
      {stepState === 2 && (
        <div className="card bg-base-100 w-256 shadow-xl">
          <figure className="h-256 w-256">
            <img src={dreamImage} />
          </figure>
          <div className="card-body">
            <p>{memory}</p>
            <div className="divider">Becomes</div>
            <p>{story}</p>
            <div className="card-actions justify-end">
              <div
                className="tooltip"
                data-tip="You can always come back to update things if you have new ideas">
                <button className="btn">?</button>
              </div>

              <button
                disabled={loading}
                onClick={onSaveDream}
                className="btn btn-primary">
                Submit
              </button>
            </div>
            {loading && <progress className="progress w-56"></progress>}
          </div>
        </div>
      )}
    </div>
  );
}

import IntervalInput from '../IntervalInput';

export default function IntervalInputExample() {
  return (
    <IntervalInput 
      id="1"
      name="Run"
      onNameChange={(name) => console.log('Name changed:', name)}
      onRemove={() => console.log('Remove clicked')}
    />
  );
}

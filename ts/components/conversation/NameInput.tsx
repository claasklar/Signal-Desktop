import React from 'react';
import { LocalizerType } from '../../types/Util';

interface PropsDataType {
  name: string;
}

interface PropsActionsType {
  onNameChange: (name: string) => void;
}

interface PropsHousekeepingType {
  i18n: LocalizerType;
}

export type PropsType = PropsDataType &
  PropsActionsType &
  PropsHousekeepingType;
type StateType = {
  name: string;
};

export class NameInput extends React.Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props);
    this.state = {
      name: props.name,
    };
  }

  handleNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ name: event.target.value });
  }

  public render(): JSX.Element {
    const { onNameChange, i18n } = this.props;
    const { name } = this.state;

    return (
      <form onSubmit={() => onNameChange(name)}>
        <input
          type="text"
          value={name}
          onChange={event => this.handleNameChange(event)}
        />
        <input type="submit" value={i18n('ok')} />
      </form>
    );
  }
}

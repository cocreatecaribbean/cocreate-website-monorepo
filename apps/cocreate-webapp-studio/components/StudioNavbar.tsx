import type {NavbarProps} from 'sanity'
import {DatasetBadge} from './DatasetBadge'

type StudioNavbarProps = NavbarProps & {
  dataset: string
}

export function StudioNavbar({dataset, ...props}: StudioNavbarProps) {
  return (
    <>
      <DatasetBadge dataset={dataset} />
      {props.renderDefault(props)}
    </>
  )
}

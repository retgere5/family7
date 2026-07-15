export type MemberColor = {
  start: string
  end: string
  ring: string
  tint: string
}

export const selfColor: MemberColor = {
  start: '#5E9BFF',
  end: '#3D6FE0',
  ring: '#4C8DFF',
  tint: '#8FB7FF',
}

export const pausedColor: MemberColor = {
  start: '#8F98AC',
  end: '#6C7488',
  ring: '#737E96',
  tint: '#8A94AD',
}

export const amberColor: MemberColor = {
  start: '#FFC178',
  end: '#F09B3C',
  ring: '#FFAE5C',
  tint: '#FFC38A',
}

export const roseColor: MemberColor = {
  start: '#FF9FB0',
  end: '#E0607F',
  ring: '#FF8FA3',
  tint: '#FFB3C1',
}

const mintColor: MemberColor = {
  start: '#7EE0B8',
  end: '#3FAF7E',
  ring: '#4CC38A',
  tint: '#8FE3BC',
}

const violetColor: MemberColor = {
  start: '#C9A5FF',
  end: '#9166E8',
  ring: '#AB84FF',
  tint: '#D3BBFF',
}

const skyColor: MemberColor = {
  start: '#7ED4EC',
  end: '#3E9DC4',
  ring: '#5BBEDF',
  tint: '#9CDFF2',
}

const otherColors = [amberColor, roseColor, mintColor, violetColor, skyColor]

export function memberColor(
  memberId: string,
  selfId: string | null | undefined,
  memberIds: string[],
) {
  if (selfId && memberId === selfId) return selfColor
  const rest = memberIds.filter((id) => id !== selfId)
  const index = rest.indexOf(memberId)
  return otherColors[(index < 0 ? 0 : index) % otherColors.length] ?? amberColor
}

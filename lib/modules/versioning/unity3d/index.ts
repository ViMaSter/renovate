import semver from 'semver';
import { regEx } from '../../../util/regex';
import { GenericVersion, GenericVersioningApi } from '../generic';
import type { VersioningApi } from '../types';

export const id = 'unity3d';
export const displayName = 'Unity3D';
export const urls = [
  'https://docs.unity3d.com/Manual/ScriptCompilationAssemblyDefinitionFiles.html#version-define-expressions:~:text=characters%20are%20supported.-,Unity%20version%20numbers,-Current%20versions%20of',
];
export const supportsRanges = false;

class Unity3dVersioningApi extends GenericVersioningApi {
  private static readonly ReleaseStreamType = new Map([
    ['Alpha', 'a'],
    ['Beta', 'b'],
    ['Patch', 'p'],
    ['Experimental', 'x'],
    ['Stable', 'f'],
    ['Stable (China)', 'c'],
  ]);
  private static readonly ReleaseStreamTypeKeyOrder = Array.from(
    Unity3dVersioningApi.ReleaseStreamType.keys(),
  );

  protected _parse(version: string): GenericVersion | null {
    const matches = regEx(
      /^(?<Major>\d+)\.(?<Minor>\d+)\.(?<Patch>\d+)(?<ReleaseStream>\w)(?<Build>\d+)/gm,
    ).exec(version);
    if (!matches) {
      return null;
    }
    const Major = matches.groups?.Major ?? '';
    const Minor = matches.groups?.Minor ?? '';
    const Patch = matches.groups?.Patch ?? '';
    const ReleaseStream = matches.groups?.ReleaseStream ?? '';
    const Build = matches.groups?.Build ?? '';

    const release = [
      parseInt(Major),
      parseInt(Minor),
      parseInt(Patch) * 1000 + parseInt(Build),
    ];
    const stable = [
      Unity3dVersioningApi.ReleaseStreamType.get('Stable'),
      Unity3dVersioningApi.ReleaseStreamType.get('Stable (China)'),
    ].includes(ReleaseStream);

    let suffix = '';
    if (version.match(/\([a-f0-9]+\)$/)) {
      suffix = version.substring(1).substring(version.length - 2);
    }
    return { release, prerelease: stable ? undefined : Build, suffix };
  }

  protected override _compare(lhs: string, rhs: string): number {
    const semverLhs = semver.parse(lhs.split(/(?=[a-z])/)[0]);
    const semverRhs = semver.parse(rhs.split(/(?=[a-z])/)[0]);

    const releaseStreamLhs = lhs.match(/(?<=[a-z])/)![0];
    const releaseStreamRhs = rhs.match(/(?<=[a-z])/)![0];

    const indexLhs =
      Unity3dVersioningApi.ReleaseStreamTypeKeyOrder.indexOf(releaseStreamLhs);
    const indexRhs =
      Unity3dVersioningApi.ReleaseStreamTypeKeyOrder.indexOf(releaseStreamRhs);

    if (indexLhs > indexRhs) {
      return 1;
    }
    if (indexLhs < indexRhs) {
      return -1;
    }

    if (!(semverLhs && semverRhs)) {
      return super._compare(lhs, rhs);
    }
    return semverLhs.compare(semverRhs);
  }
}

export const api: VersioningApi = new Unity3dVersioningApi();

export default api;

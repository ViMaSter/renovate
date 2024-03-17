import { XmlDocument } from 'xmldoc';
import { cache } from '../../../util/cache/package/decorator';
import * as Unity3dVersioning from '../../versioning/unity3d';
import { Datasource } from '../datasource';
import type { GetReleasesConfig, Release, ReleaseResult } from '../types';

export class Unity3dDatasource extends Datasource {
  static readonly homepage = 'https://unity.com/';
  static readonly streams: { [key: string]: string } = {
    lts: `${Unity3dDatasource.homepage}/releases/editor/lts-releases.xml`,
    stable: `${Unity3dDatasource.homepage}/releases/editor/releases.xml`,
    beta: `${Unity3dDatasource.homepage}/releases/editor/beta/latest.xml`,
  };

  static readonly id = 'unity3d';

  override readonly defaultRegistryUrls = [
    Unity3dDatasource.streams.stable,
    Unity3dDatasource.streams.lts,
  ];

  override readonly defaultVersioning = Unity3dVersioning.id;

  override readonly registryStrategy = 'merge';

  constructor() {
    super(Unity3dDatasource.id);
  }

  async getByStream(
    registryUrl: string | undefined,
    withHash: boolean,
  ): Promise<ReleaseResult | null> {
    const response = await this.http.get(registryUrl!);
    const document = new XmlDocument(response.body);
    const channel = document.childNamed('channel');
    if (!channel) {
      return { releases: [], homepage: Unity3dDatasource.homepage };
    }
    const releases = channel
      .childrenNamed('item')
      .map((itemNode) => {
        const versionWithHash = `${itemNode.childNamed('title')?.val} (${itemNode.childNamed('guid')?.val})`;
        const versionWithoutHash = itemNode.childNamed('title')?.val;
        const release: Release = {
          version: withHash ? versionWithHash : versionWithoutHash!,
          releaseTimestamp: itemNode.childNamed('pubDate')?.val,
          changelogUrl: itemNode.childNamed('link')?.val,
          isStable: registryUrl !== Unity3dDatasource.streams.beta,
          registryUrl,
        };
        return release;
      })
      .filter((release): release is Release => !!release);

    return {
      releases,
      homepage: Unity3dDatasource.homepage,
    };
  };

  @cache({
    namespace: `datasource-${Unity3dDatasource.id}`,
    key: ({ registryUrl, packageName }: GetReleasesConfig) =>
      `${registryUrl}:${packageName}`,
  })
  async getReleases({
    packageName,
    registryUrl,
  }: GetReleasesConfig): Promise<ReleaseResult | null> {
    return await this.getByStream(
      registryUrl,
      packageName === 'm_EditorVersionWithRevision',
    );
  }
}

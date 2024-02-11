import { Fixtures } from '../../../../test/fixtures';
import * as httpMock from '../../../../test/http-mock';
import { Unity3dDatasource } from '.';

const unity3dProviderDatasource = new Unity3dDatasource();
const mockRSSFeeds = () => {
    Object.entries(Unity3dDatasource.streams).map(([stream, url]) => {
        const content = Fixtures.get(stream+'.xml');

        const uri = new URL(url);
        
        httpMock
            .scope(uri.origin)
            .get(uri.pathname)
            .reply(200, content);
    });
}

describe('modules/datasource/terraform-provider/index', () => {
    it('returns different versions for each stream', async () => {
        mockRSSFeeds();
        const responses : {[keys: string]: string[]} = Object.fromEntries(await Promise.all(Object.keys(Unity3dDatasource.streams).map(async (stream) => [stream, (await unity3dProviderDatasource.getByStream(Unity3dDatasource.streams[stream], false))?.releases.map((release) => release.version)])));

        // none of the items in responses.beta are in responses.stable or responses.lts
        expect(responses.beta.every((betaVersion) => !responses.stable.includes(betaVersion) && !responses.lts.includes(betaVersion))).toBe(true);
        // some items in responses.stable are in responses.lts
        expect(responses.stable.some((stableVersion) => responses.lts.includes(stableVersion))).toBe(true);
        // not all items in responses.stable are in responses.lts
        expect(responses.stable.every((stableVersion) => responses.lts.includes(stableVersion))).toBe(false);
    })
});
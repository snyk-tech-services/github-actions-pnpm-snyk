import fs, { readFileSync } from "fs";
import nock from "nock";

beforeEach(() => {
  return nock("https://fixtures.snyk.io")
    .get(/.*/)
    .reply(200, function (uri, requestBody) {
      return fs.createReadStream(__dirname + "/fixtures/" + uri); //diffs/requirements.txt');
    });
});

describe("Whatever you want to test", () => {
  it("Test case 1", async () => {
    expect(true).toBeTruthy();
  });
});

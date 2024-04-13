export interface Version {
    version: string;
    changes: string[];
  }

interface VersionHistory {
  currentVersion: Version;
  previousVersions: Version[];
}
  
var versionHistory: VersionHistory = {
  currentVersion: {
    version: "1.0.0",
    changes: ["Initial release"]
  },
  previousVersions: []
};

export function getCurrentVersion(): Version {
    return versionHistory.currentVersion;
}
  
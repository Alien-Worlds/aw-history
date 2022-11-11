export type PathLink = {
  link: string[][];
  path: string;
};

export type PathLabel = {
  label: string;
  path: string;
};

export class ProcessorPaths {
  private links: PathLink[] = [];
  constructor(paths: PathLabel[]) {
    this.links = paths.reduce((list: PathLink[], pathLabel: PathLabel) => {
      const { path, label } = pathLabel;
      const pathLink = { path, link: [] };
      label.split(':').forEach(part => pathLink.link.push(part.split(',')));
      list.push(pathLink);
      return list;
    }, []);
  }

  public getPath(label: string): string {
    const parts = label.split(':');
    const { links } = this;

    for (const pathLink of links) {
      let matchFound = false;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const link = pathLink.link[i];

        if (!link) {
          break;
        }

        if (
          (i === 0 && link.includes('*')) ||
          (i > 0 && link.includes('*') && matchFound)
        ) {
          return pathLink.path;
        } else if (link.includes(part)) {
          matchFound = true;
        } else {
          matchFound = false;
        }
      }
      if (matchFound) {
        return pathLink.path;
      }
    }

    return '';
  }
}

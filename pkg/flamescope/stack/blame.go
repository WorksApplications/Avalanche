package stack

import (
	"sort"
)

func getDominantNode(frame *Stack, threashold float32, maxDepth int) *Stack {
	if maxDepth < 0 {
		return frame
	}
	var choosen *Stack
	for i, c := range frame.Children {
		per := float32(c.Value) / float32(frame.Value)
		if threashold <= per {
			choosen = &frame.Children[i]
		}
	}
	if choosen == nil {
		return frame
	} else {
		return getDominantNode(choosen, threashold, maxDepth-1)
	}
}

type byValue []Stack

func (a byValue) Len() int           { return len(a) }
func (a byValue) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byValue) Less(i, j int) bool { return a[i].Value < a[j].Value }

func sortByValue(frames *[]Stack) {
	sort.Sort(byValue(*frames))
}

func assignCode(frame *Stack, name, mode, template string) {
}
